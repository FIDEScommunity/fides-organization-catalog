import fs from 'fs/promises';
import path from 'path';
import { execFileSync } from 'child_process';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { matchesOrganization, orgCodeFromCredentialId, orgCodeFromIssuerId } from './matching.js';
import type {
  SourceOrganizationCatalog,
  AggregatedOrganization,
  AggregatedOrganizationCatalog,
  AggregatedStats,
  EcosystemRef,
  OrganizationCertification,
  OrganizationHistoryState,
  OrganizationSectorCode,
} from '../types/organization.js';
import { ORGANIZATION_SECTOR_CODES } from '../types/organization.js';

const ROOT = path.resolve(process.cwd());

const CONFIG = {
  schemaPath: path.join(ROOT, 'schemas/organization-catalog.schema.json'),
  sourceDir: path.join(ROOT, 'community-catalogs'),
  outputPath: path.join(ROOT, 'data/aggregated.json'),
  wpPluginDataPath: path.join(ROOT, 'wordpress-plugin/fides-organization-catalog/data/aggregated.json'),
  historyPath: path.join(ROOT, 'data/org-history-state.json'),
};

/** Community catalog path from repo root (forward slashes) for stable git diffs across machines. */
function repoRelativeCatalogPath(absoluteFilePath: string): string {
  return path.relative(ROOT, absoluteFilePath).split(path.sep).join('/');
}

/** One certification per code in aggregated output (first occurrence wins). */
function dedupeCertifications(items: OrganizationCertification[] | undefined): OrganizationCertification[] | undefined {
  if (!items?.length) return undefined;
  const seen = new Set<string>();
  const out: OrganizationCertification[] = [];
  for (const item of items) {
    if (seen.has(item.code)) continue;
    seen.add(item.code);
    const entry: OrganizationCertification = { code: item.code };
    if (item.evidence) entry.evidence = item.evidence;
    out.push(entry);
  }
  return out.length ? out : undefined;
}

const SECTOR_ORDER = new Map(ORGANIZATION_SECTOR_CODES.map((c, i) => [c, i]));

/** Dedupe and stable-sort sectors (invalid entries dropped; schema should prevent invalid). */
function normalizeSectors(sectors: OrganizationSectorCode[] | undefined): OrganizationSectorCode[] {
  if (!sectors?.length) return [];
  const allowed = new Set(ORGANIZATION_SECTOR_CODES);
  const seen = new Set<string>();
  const out: OrganizationSectorCode[] = [];
  for (const s of sectors) {
    if (!allowed.has(s) || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  out.sort((a, b) => (SECTOR_ORDER.get(a) ?? 0) - (SECTOR_ORDER.get(b) ?? 0));
  return out;
}

/** Public Blue Pages DID API (same path as WordPress proxy /validations). */
const DEFAULT_BLUE_PAGES_API_BASE = 'https://bluepages.fides.community/api/public/did';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkBluePagesValidations(apiBase: string, did: string): Promise<boolean> {
  const url = `${apiBase}/${encodeURIComponent(did)}/validations`;
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return false;
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('json')) return false;
    const body: unknown = await res.json();
    return body !== null && typeof body === 'object';
  } catch {
    return false;
  }
}

/**
 * Sets bluePages.profileAvailable by calling the public Blue Pages validations endpoint per DID.
 * Env: FIDES_SKIP_BLUE_PAGES_CHECK=1 to skip (keeps bluePages.did only; UI falls back to legacy rules).
 * Env: FIDES_BLUE_PAGES_API_BASE_URL override base (no trailing slash).
 * Env: FIDES_BLUE_PAGES_CHECK_CONCURRENCY (default 4, max 12).
 */
async function enrichBluePagesProfiles(orgs: AggregatedOrganization[], checkedAt: string): Promise<void> {
  const withDid = orgs.filter((o) => o.identifiers?.did);
  if (withDid.length === 0) return;

  const skip =
    process.env.FIDES_SKIP_BLUE_PAGES_CHECK === '1' ||
    String(process.env.FIDES_SKIP_BLUE_PAGES_CHECK || '').toLowerCase() === 'true';

  if (skip) {
    console.log('\nBlue Pages API check skipped (FIDES_SKIP_BLUE_PAGES_CHECK)');
    for (const o of withDid) {
      o.bluePages = { did: o.identifiers!.did! };
    }
    return;
  }

  const apiBase = (process.env.FIDES_BLUE_PAGES_API_BASE_URL || DEFAULT_BLUE_PAGES_API_BASE).replace(/\/$/, '');
  const concRaw = Number(process.env.FIDES_BLUE_PAGES_CHECK_CONCURRENCY);
  const concurrency =
    Number.isFinite(concRaw) && concRaw >= 1 ? Math.min(12, Math.floor(concRaw)) : 4;

  console.log(`\nBlue Pages API (${apiBase}): checking ${withDid.length} DID(s), concurrency ${concurrency}...`);
  let ok = 0;
  for (let i = 0; i < withDid.length; i += concurrency) {
    const batch = withDid.slice(i, i + concurrency);
    const results = await Promise.all(
      batch.map(async (o) => {
        const did = o.identifiers!.did!;
        const profileAvailable = await checkBluePagesValidations(apiBase, did);
        o.bluePages = { did, profileAvailable, checkedAt };
        return profileAvailable;
      }),
    );
    ok += results.filter(Boolean).length;
    if (i + concurrency < withDid.length) await sleep(100);
  }
  console.log(`  ${ok} / ${withDid.length} DID(s) returned valid JSON from …/validations`);
}

// Cross-catalog aggregated data URLs (GitHub raw primary, local fallback)
const CROSS_CATALOGS = {
  wallet: {
    url: 'https://raw.githubusercontent.com/FIDEScommunity/fides-wallet-catalog/main/data/aggregated.json',
    local: path.resolve(ROOT, '..', 'wallet-catalog', 'data', 'aggregated.json'),
  },
  issuer: {
    url: 'https://raw.githubusercontent.com/FIDEScommunity/fides-issuer-catalog/main/data/aggregated.json',
    local: path.resolve(ROOT, '..', 'issuer-catalog', 'data', 'aggregated.json'),
  },
  credential: {
    url: 'https://raw.githubusercontent.com/FIDEScommunity/fides-credential-catalog/main/data/aggregated.json',
    local: path.resolve(ROOT, '..', 'credential-catalog', 'data', 'aggregated.json'),
  },
  rp: {
    url: 'https://raw.githubusercontent.com/FIDEScommunity/fides-rp-catalog/main/data/aggregated.json',
    local: path.resolve(ROOT, '..', 'rp-catalog', 'data', 'aggregated.json'),
  },
};

const gitDateCache = new Map<string, string | null>();

function getGitLastCommitDate(filePath: string): string | null {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
  if (gitDateCache.has(rel)) return gitDateCache.get(rel) ?? null;
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%aI', '--', rel], {
      cwd: ROOT,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    const d = out ? new Date(out) : null;
    const iso = d && !Number.isNaN(d.getTime()) ? d.toISOString() : null;
    gitDateCache.set(rel, iso);
    return iso;
  } catch {
    gitDateCache.set(rel, null);
    return null;
  }
}

async function loadJson<T>(url: string, localPath: string, label: string): Promise<T | null> {
  // Prefer local in dev
  try {
    const raw = await fs.readFile(localPath, 'utf-8');
    const data = JSON.parse(raw) as T;
    console.log(`  ${label}: loaded from local (${localPath})`);
    return data;
  } catch {
    // try remote
  }
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as T;
    console.log(`  ${label}: loaded from GitHub`);
    return data;
  } catch (err) {
    console.warn(`  ${label}: could not load (${(err as Error).message})`);
    return null;
  }
}

async function loadHistory(): Promise<OrganizationHistoryState> {
  try {
    return JSON.parse(await fs.readFile(CONFIG.historyPath, 'utf-8')) as OrganizationHistoryState;
  } catch {
    return {};
  }
}

async function saveHistory(state: OrganizationHistoryState): Promise<void> {
  await fs.mkdir(path.dirname(CONFIG.historyPath), { recursive: true });
  await fs.writeFile(CONFIG.historyPath, JSON.stringify(state, null, 2));
}

interface CrossCatalogData {
  wallets: Array<{ id: string; name: string; type: string; provider: { name: string; did?: string } }>;
  issuers: Array<{
    id: string;
    displayName: string;
    orgId?: string;
    organization: { name: string; did?: string };
  }>;
  credentials: Array<{
    id: string;
    displayName: string;
    orgId?: string;
    provider: { name: string; did?: string };
  }>;
  rps: Array<{ id: string; name: string; provider: { name: string; did?: string } }>;
}

async function loadCrossCatalogs(): Promise<CrossCatalogData> {
  console.log('\nLoading cross-catalog data...');

  const walletData = await loadJson<{ wallets?: CrossCatalogData['wallets'] }>(
    CROSS_CATALOGS.wallet.url, CROSS_CATALOGS.wallet.local, 'wallet-catalog',
  );
  const issuerData = await loadJson<{ issuers?: CrossCatalogData['issuers'] }>(
    CROSS_CATALOGS.issuer.url, CROSS_CATALOGS.issuer.local, 'issuer-catalog',
  );
  const credData = await loadJson<{ credentials?: CrossCatalogData['credentials'] }>(
    CROSS_CATALOGS.credential.url, CROSS_CATALOGS.credential.local, 'credential-catalog',
  );
  const rpData = await loadJson<{ relyingParties?: CrossCatalogData['rps'] }>(
    CROSS_CATALOGS.rp.url, CROSS_CATALOGS.rp.local, 'rp-catalog',
  );

  return {
    wallets: walletData?.wallets || [],
    issuers: issuerData?.issuers || [],
    credentials: credData?.credentials || [],
    rps: rpData?.relyingParties || [],
  };
}

function buildEcosystemRoles(
  org: { id: string; name: string; legalName?: string; identifiers?: { did?: string } },
  cross: CrossCatalogData,
): AggregatedOrganization['ecosystemRoles'] {
  const orgDid = org.identifiers?.did;

  const issuers: EcosystemRef[] = cross.issuers
    .filter((i) =>
      i.orgId
        ? org.id === i.orgId
        : matchesOrganization(
            { ...org, did: orgDid },
            {
              name: i.organization.name,
              did: i.organization.did,
              dirName: orgCodeFromIssuerId(i.id),
            },
          ),
    )
    .map((i) => ({ id: i.id, displayName: i.displayName }));

  const credentialTypes: EcosystemRef[] = cross.credentials
    .filter((c) =>
      c.orgId
        ? org.id === c.orgId
        : matchesOrganization(
            { ...org, did: orgDid },
            {
              name: c.provider.name,
              did: c.provider.did,
              dirName: orgCodeFromCredentialId(c.id),
            },
          ),
    )
    .map((c) => ({ id: c.id, displayName: c.displayName }));

  const personalWallets: EcosystemRef[] = cross.wallets
    .filter((w) => w.type === 'personal' && matchesOrganization({ ...org, did: orgDid }, { name: w.provider.name, did: w.provider.did, dirName: undefined }))
    .map((w) => ({ id: w.id, displayName: w.name }));

  const businessWallets: EcosystemRef[] = cross.wallets
    .filter((w) => w.type === 'organizational' && matchesOrganization({ ...org, did: orgDid }, { name: w.provider.name, did: w.provider.did, dirName: undefined }))
    .map((w) => ({ id: w.id, displayName: w.name }));

  const relyingParties: EcosystemRef[] = cross.rps
    .filter((r) => matchesOrganization({ ...org, did: orgDid }, { name: r.provider.name, did: r.provider.did, dirName: undefined }))
    .map((r) => ({ id: r.id, displayName: r.name }));

  return { issuers, credentialTypes, personalWallets, businessWallets, relyingParties };
}

function calculateStats(orgs: AggregatedOrganization[]): AggregatedStats {
  const byCountry: Record<string, number> = {};
  let withIssuers = 0;
  let withCredentialTypes = 0;
  let withWallets = 0;
  let withRelyingParties = 0;
  let withBluePagesProfile = 0;

  for (const o of orgs) {
    if (o.country) byCountry[o.country] = (byCountry[o.country] || 0) + 1;
    if (o.ecosystemRoles.issuers.length > 0) withIssuers++;
    if (o.ecosystemRoles.credentialTypes.length > 0) withCredentialTypes++;
    if (o.ecosystemRoles.personalWallets.length + o.ecosystemRoles.businessWallets.length > 0) withWallets++;
    if (o.ecosystemRoles.relyingParties.length > 0) withRelyingParties++;
    if (o.bluePages?.profileAvailable === true) withBluePagesProfile++;
  }

  return {
    totalOrganizations: orgs.length,
    byCountry,
    withIssuers,
    withCredentialTypes,
    withWallets,
    withRelyingParties,
    withBluePagesProfile,
  };
}

async function initValidator() {
  const schema = JSON.parse(await fs.readFile(CONFIG.schemaPath, 'utf-8'));
  const ajv = new Ajv2020({ allErrors: true });
  addFormats(ajv);
  return ajv.compile(schema);
}

async function crawl(): Promise<void> {
  console.log('FIDES Organization Catalog Crawler\n');

  const validate = await initValidator();
  const history = await loadHistory();
  const now = new Date().toISOString();

  const cross = await loadCrossCatalogs();
  console.log(`  wallets: ${cross.wallets.length}, issuers: ${cross.issuers.length}, credentials: ${cross.credentials.length}, rps: ${cross.rps.length}\n`);

  const sourceDirs = (await fs.readdir(CONFIG.sourceDir).catch(() => [] as string[]))
    .filter((d) => !d.startsWith('.'));

  const organizations: AggregatedOrganization[] = [];

  for (const dirName of sourceDirs) {
    const filePath = path.join(CONFIG.sourceDir, dirName, 'organization-catalog.json');
    let raw: string;
    try {
      raw = await fs.readFile(filePath, 'utf-8');
    } catch {
      continue;
    }

    let catalog: SourceOrganizationCatalog;
    try {
      catalog = JSON.parse(raw) as SourceOrganizationCatalog;
    } catch {
      console.error(`  Invalid JSON in ${dirName}`);
      continue;
    }

    if (!validate(catalog)) {
      console.error(`  Validation failed for ${dirName}:`, validate.errors);
      continue;
    }

    const org = catalog.organization;
    const gitDate = getGitLastCommitDate(filePath);
    const updatedAt = catalog.lastUpdated || gitDate || now;

    if (!history[org.id]) {
      history[org.id] = { firstSeenAt: updatedAt };
    }

    const ecosystemRoles = buildEcosystemRoles(
      { id: org.id, name: org.name, legalName: org.legalName, identifiers: org.identifiers },
      cross,
    );

    const totalRoles =
      ecosystemRoles.issuers.length +
      ecosystemRoles.credentialTypes.length +
      ecosystemRoles.personalWallets.length +
      ecosystemRoles.businessWallets.length +
      ecosystemRoles.relyingParties.length;

    console.log(`  ${org.name} (${org.id}) — ${totalRoles} ecosystem role(s)`);

    const didForBp = org.identifiers?.did;
    const certifications = dedupeCertifications(org.certifications);
    const sectors = normalizeSectors(org.sectors);
    organizations.push({
      id: org.id,
      name: org.name,
      sectors,
      legalName: org.legalName,
      description: org.description,
      ...(org.identifiers ? { identifiers: org.identifiers } : {}),
      website: org.website,
      logoUri: org.logo,
      country: org.country,
      ...(certifications ? { certifications } : {}),
      tags: org.tags,
      ...(org.fidesManifestoSupporter === true ? { fidesManifestoSupporter: true } : {}),
      contact: org.contact,
      source: 'community-catalog',
      catalogUrl: repoRelativeCatalogPath(filePath),
      ecosystemRoles,
      bluePages: didForBp ? { did: didForBp } : undefined,
      firstSeenAt: history[org.id].firstSeenAt,
      updatedAt,
      fetchedAt: now,
    });
  }

  await enrichBluePagesProfiles(organizations, now);

  organizations.sort((a, b) => a.name.localeCompare(b.name));

  const output: AggregatedOrganizationCatalog = {
    schemaVersion: '1.0.0',
    catalogType: 'organization',
    lastUpdated: now,
    organizations,
    stats: calculateStats(organizations),
  };

  await fs.mkdir(path.dirname(CONFIG.outputPath), { recursive: true });
  await fs.writeFile(CONFIG.outputPath, JSON.stringify(output, null, 2));
  console.log(`\nWritten to ${CONFIG.outputPath}`);

  await fs.mkdir(path.dirname(CONFIG.wpPluginDataPath), { recursive: true });
  await fs.writeFile(CONFIG.wpPluginDataPath, JSON.stringify(output, null, 2));
  console.log(`Written to ${CONFIG.wpPluginDataPath}`);

  await saveHistory(history);

  console.log(`\nStats:`);
  console.log(`  Organizations: ${output.stats.totalOrganizations}`);
  console.log(`  With issuers: ${output.stats.withIssuers}`);
  console.log(`  With credentials: ${output.stats.withCredentialTypes}`);
  console.log(`  With wallets: ${output.stats.withWallets}`);
  console.log(`  With RPs: ${output.stats.withRelyingParties}`);
  console.log(`  Blue Pages profile (API): ${output.stats.withBluePagesProfile ?? 0}`);
}

crawl().catch((err) => {
  console.error('Crawler failed:', err);
  process.exit(1);
});
