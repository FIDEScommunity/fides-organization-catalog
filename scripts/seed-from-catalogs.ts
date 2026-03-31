/**
 * Seed script: generate initial organization-catalog.json files
 * from existing provider/organization data across all FIDES catalogs.
 *
 * Run once:  npm run seed
 *
 * This reads the community-catalogs directories of wallet-catalog,
 * issuer-catalog, rp-catalog, and credential-catalog, extracts unique
 * organizations, merges their data, and writes one JSON file per org.
 */

import fs from 'fs/promises';
import path from 'path';

const ROOT = path.resolve(process.cwd());
const OUTPUT_DIR = path.join(ROOT, 'community-catalogs');

const CATALOG_REPOS = {
  wallet: path.resolve(ROOT, '..', 'wallet-catalog'),
  issuer: path.resolve(ROOT, '..', 'issuer-catalog'),
  rp: path.resolve(ROOT, '..', 'rp-catalog'),
  credential: path.resolve(ROOT, '..', 'credential-catalog'),
};

interface RawOrg {
  dirName: string;
  name: string;
  did?: string;
  website?: string;
  logo?: string;
  country?: string;
  contact?: { email?: string; support?: string };
  sources: string[];
}

async function readJsonSafe(filePath: string): Promise<Record<string, unknown> | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function extractOrg(
  data: Record<string, unknown>,
  orgKey: string,
): { name: string; did?: string; website?: string; logo?: string; country?: string; contact?: { email?: string; support?: string } } | null {
  const org = data[orgKey] as Record<string, unknown> | undefined;
  if (!org || typeof org.name !== 'string') return null;
  return {
    name: org.name as string,
    did: typeof org.did === 'string' ? org.did : undefined,
    website: typeof org.website === 'string' ? org.website : undefined,
    logo: typeof org.logo === 'string' ? org.logo : undefined,
    country: typeof org.country === 'string' ? org.country : undefined,
    contact: org.contact as { email?: string; support?: string } | undefined,
  };
}

async function scanCatalog(
  repoPath: string,
  catalogFileName: string,
  orgKey: string,
  sourceLabel: string,
): Promise<Map<string, RawOrg>> {
  const orgs = new Map<string, RawOrg>();
  const communityDir = path.join(repoPath, 'community-catalogs');

  let dirs: string[];
  try {
    dirs = await fs.readdir(communityDir);
  } catch {
    console.log(`  (skipping ${sourceLabel}: ${communityDir} not found)`);
    return orgs;
  }

  for (const dirName of dirs) {
    const filePath = path.join(communityDir, dirName, catalogFileName);
    const data = await readJsonSafe(filePath);
    if (!data) continue;

    const org = extractOrg(data, orgKey);
    if (!org) continue;

    const existing = orgs.get(dirName);
    if (existing) {
      if (!existing.did && org.did) existing.did = org.did;
      if (!existing.website && org.website) existing.website = org.website;
      if (!existing.logo && org.logo) existing.logo = org.logo;
      if (!existing.country && org.country) existing.country = org.country;
      if (!existing.contact && org.contact) existing.contact = org.contact;
      existing.sources.push(sourceLabel);
    } else {
      orgs.set(dirName, {
        dirName,
        name: org.name,
        did: org.did,
        website: org.website,
        logo: org.logo,
        country: org.country,
        contact: org.contact,
        sources: [sourceLabel],
      });
    }
  }

  console.log(`  ${sourceLabel}: ${orgs.size} organization(s)`);
  return orgs;
}

function mergeInto(target: Map<string, RawOrg>, source: Map<string, RawOrg>): void {
  for (const [dirName, org] of source) {
    const existing = target.get(dirName);
    if (existing) {
      if (!existing.did && org.did) existing.did = org.did;
      if (!existing.website && org.website) existing.website = org.website;
      if (!existing.logo && org.logo) existing.logo = org.logo;
      if (!existing.country && org.country) existing.country = org.country;
      if (!existing.contact && org.contact) existing.contact = org.contact;
      existing.sources.push(...org.sources);
    } else {
      target.set(dirName, { ...org });
    }
  }
}

async function seed(): Promise<void> {
  console.log('Seeding organization-catalog from existing FIDES catalogs...\n');

  const allOrgs = new Map<string, RawOrg>();

  const walletOrgs = await scanCatalog(CATALOG_REPOS.wallet, 'wallet-catalog.json', 'provider', 'wallet-catalog');
  mergeInto(allOrgs, walletOrgs);

  const issuerOrgs = await scanCatalog(CATALOG_REPOS.issuer, 'issuer-catalog.json', 'organization', 'issuer-catalog');
  mergeInto(allOrgs, issuerOrgs);

  const rpOrgs = await scanCatalog(CATALOG_REPOS.rp, 'rp-catalog.json', 'provider', 'rp-catalog');
  mergeInto(allOrgs, rpOrgs);

  const credOrgs = await scanCatalog(CATALOG_REPOS.credential, 'credential-catalog.json', 'provider', 'credential-catalog');
  mergeInto(allOrgs, credOrgs);

  console.log(`\nTotal unique organizations: ${allOrgs.size}\n`);

  let written = 0;
  let skipped = 0;

  for (const [dirName, org] of [...allOrgs.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const outDir = path.join(OUTPUT_DIR, dirName);
    const outFile = path.join(outDir, 'organization-catalog.json');

    try {
      await fs.access(outFile);
      skipped++;
      continue;
    } catch {
      // file does not exist yet
    }

    const orgCode = dirName.toLowerCase();
    const orgObj: Record<string, unknown> = {
      id: `org:${orgCode}`,
      name: org.name,
      sectors: ['digital'],
    };
    if (org.did) orgObj.identifiers = { did: org.did };
    if (org.website) orgObj.website = org.website;
    if (org.logo) orgObj.logo = org.logo;
    if (org.country) orgObj.country = org.country;
    if (org.contact) orgObj.contact = org.contact;

    const catalog = {
      $schema: 'https://fides.community/schemas/organization-catalog/v1',
      organization: orgObj,
    };

    await fs.mkdir(outDir, { recursive: true });
    await fs.writeFile(outFile, JSON.stringify(catalog, null, 2) + '\n');
    written++;
  }

  console.log(`Written: ${written} new file(s)`);
  if (skipped > 0) console.log(`Skipped: ${skipped} (already exist)`);
  console.log('\nDone. Review the generated files, then commit.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
