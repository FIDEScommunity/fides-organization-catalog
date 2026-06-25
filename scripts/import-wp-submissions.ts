#!/usr/bin/env tsx
/**
 * Import published WordPress catalog submissions into community-catalogs/.
 *
 * Fetches GET /wp-json/fides-catalog/v1/export/{type} (secret header), writes one JSON
 * file per entry, tracks WP-managed slugs for pruning, and preserves QTSP certifications
 * on merge when the existing community file already has them.
 *
 * Usage:
 *   FIDES_CATALOG_SECRET=... npm run import-wp-submissions
 *   FIDES_CATALOG_SECRET=... npm run import-wp-submissions -- --apply
 *   npm run wp-sync:local
 *
 * Environment:
 *   FIDES_WP_EXPORT_URL — default http://utrecht-demo.local/wp-json/fides-catalog/v1/export/organization
 *   FIDES_CATALOG_SECRET or WP_INVALIDATE_SECRET — X-FIDES-Catalog-Secret value
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(process.cwd());
const COMMUNITY_DIR = path.join(ROOT, 'community-catalogs');
const STATE_PATH = path.join(ROOT, 'data/wp-submission-state.json');
const MARKER_FILENAME = '.wordpress-source';
const COMMUNITY_FILENAME = 'organization-catalog.json';
const SECRET_HEADER = 'X-FIDES-Catalog-Secret';
const USER_AGENT = 'FIDES-Catalog-Automation/1.0';

function wpExportBlockHint(body: string, status: number): string | null {
  if (body.includes('sgcaptcha') || body.includes('.well-known/captcha')) {
    return [
      `SiteGround Anti-Bot AI blocked this request (HTTP ${status}).`,
      'GitHub Actions cannot solve the captcha challenge.',
      'Fix: enable GitHub push sync in WP Settings → FIDES Catalog SEO (PAT with repo + workflow scope),',
      'or ask SiteGround support to disable Anti-Bot AI for /wp-json/fides-catalog/.',
    ].join(' ');
  }
  return null;
}

export type WpExportEntry = {
  itemId: string;
  slug: string;
  filename: string;
  source: string;
  document: Record<string, unknown>;
  publishedAt?: string | null;
  updatedAt?: string | null;
};

export type WpExportPayload = {
  schemaVersion: string;
  catalogType: string;
  generatedAt: string;
  entries: WpExportEntry[];
};

export type WpSubmissionState = {
  schemaVersion: '1.0.0';
  catalogType: string;
  lastImportAt: string | null;
  managedSlugs: string[];
};

type ImportPlan = {
  write: Array<{ slug: string; itemId: string; path: string; qtspMerge: boolean }>;
  prune: string[];
  skipped: Array<{ slug: string; reason: string }>;
};

function parseArgs(argv: string[]) {
  const apply = argv.includes('--apply');
  const wpUrl = (() => {
    const idx = argv.indexOf('--wp-url');
    if (idx >= 0 && argv[idx + 1]) {
      return argv[idx + 1];
    }
    return process.env.FIDES_WP_EXPORT_URL
      ?? 'http://utrecht-demo.local/wp-json/fides-catalog/v1/export/organization';
  })();
  const secret = (() => {
    const idx = argv.indexOf('--secret');
    if (idx >= 0 && argv[idx + 1]) {
      return argv[idx + 1];
    }
    return process.env.FIDES_CATALOG_SECRET ?? process.env.WP_INVALIDATE_SECRET ?? '';
  })();
  return { apply, wpUrl, secret };
}

function isSafeSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export function emptyState(catalogType: string): WpSubmissionState {
  return {
    schemaVersion: '1.0.0',
    catalogType,
    lastImportAt: null,
    managedSlugs: [],
  };
}

export async function readState(): Promise<WpSubmissionState> {
  try {
    const raw = await fs.readFile(STATE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as WpSubmissionState;
    if (!parsed || !Array.isArray(parsed.managedSlugs)) {
      return emptyState('organization');
    }
    return parsed;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return emptyState('organization');
    }
    throw err;
  }
}

export function hasQtspCertification(document: Record<string, unknown>): boolean {
  const org = document.organization;
  if (!org || typeof org !== 'object') {
    return false;
  }
  const certifications = (org as Record<string, unknown>).certifications;
  if (!Array.isArray(certifications)) {
    return false;
  }
  return certifications.some(
    (item) => item && typeof item === 'object' && (item as Record<string, unknown>).code === 'qtsp',
  );
}

export function mergeQtspCertifications(
  incoming: Record<string, unknown>,
  existing: Record<string, unknown>,
): Record<string, unknown> {
  if (!hasQtspCertification(existing)) {
    return incoming;
  }
  const merged = structuredClone(incoming);
  const existingOrg = existing.organization;
  const incomingOrg = merged.organization;
  if (!existingOrg || typeof existingOrg !== 'object' || !incomingOrg || typeof incomingOrg !== 'object') {
    return incoming;
  }
  const certifications = (existingOrg as Record<string, unknown>).certifications;
  if (Array.isArray(certifications) && certifications.length > 0) {
    (incomingOrg as Record<string, unknown>).certifications = structuredClone(certifications);
  }
  return merged;
}

export function normalizeDocument(entry: WpExportEntry): Record<string, unknown> {
  const document = structuredClone(entry.document);
  const org = document.organization;
  if (!org || typeof org !== 'object') {
    document.organization = { id: entry.itemId };
  } else {
    (org as Record<string, unknown>).id = entry.itemId;
  }
  return document;
}

export function buildImportPlan(
  entries: WpExportEntry[],
  previousState: WpSubmissionState,
): ImportPlan {
  const plan: ImportPlan = { write: [], prune: [], skipped: [] };
  const currentSlugs = new Set<string>();

  for (const entry of entries) {
    const slug = entry.slug.trim();
    const itemId = entry.itemId.trim();
    if (!slug || !itemId || entry.filename !== COMMUNITY_FILENAME) {
      plan.skipped.push({ slug: slug || '(missing)', reason: 'invalid entry metadata' });
      continue;
    }
    if (!isSafeSlug(slug)) {
      plan.skipped.push({ slug, reason: 'unsafe slug' });
      continue;
    }
    currentSlugs.add(slug);
    plan.write.push({
      slug,
      itemId,
      path: path.join(COMMUNITY_DIR, slug, COMMUNITY_FILENAME),
      qtspMerge: false,
    });
  }

  for (const slug of previousState.managedSlugs) {
    if (!currentSlugs.has(slug)) {
      plan.prune.push(slug);
    }
  }

  return plan;
}

export async function fetchWpExport(wpUrl: string, secret: string): Promise<WpExportPayload> {
  if (!secret.trim()) {
    throw new Error(
      'Missing catalog secret. Set FIDES_CATALOG_SECRET or WP_INVALIDATE_SECRET, or pass --secret.',
    );
  }
  const response = await fetch(wpUrl, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      [SECRET_HEADER]: secret,
      'User-Agent': USER_AGENT,
    },
    signal: AbortSignal.timeout(60_000),
  });
  const contentType = response.headers.get('content-type') ?? '';
  const body = await response.text();
  const blockHint = wpExportBlockHint(body, response.status);
  if (blockHint) {
    throw new Error(`${blockHint} Body starts with: ${body.slice(0, 160).replace(/\s+/g, ' ')}`);
  }
  if (!response.ok) {
    throw new Error(`WP export failed (HTTP ${response.status}, ${contentType}): ${body.slice(0, 300)}`);
  }
  if (!contentType.includes('json')) {
    throw new Error(
      `WP export returned non-JSON (HTTP ${response.status}, ${contentType}). `
      + `Body starts with: ${body.slice(0, 200).replace(/\s+/g, ' ')}`,
    );
  }
  let payload: WpExportPayload;
  try {
    payload = JSON.parse(body) as WpExportPayload;
  } catch {
    throw new Error(
      `WP export JSON parse failed (HTTP ${response.status}). Body starts with: ${body.slice(0, 200).replace(/\s+/g, ' ')}`,
    );
  }
  if (!payload?.entries) {
    throw new Error('WP export response is missing entries array.');
  }
  return payload;
}

export function loadInlineExportPayload(): WpExportPayload | null {
  const inline = process.env.FIDES_WP_EXPORT_JSON?.trim();
  if (!inline) return null;
  try {
    const payload = JSON.parse(inline) as WpExportPayload;
    if (!payload?.entries || !Array.isArray(payload.entries)) {
      throw new Error('export_json is missing entries array.');
    }
    return payload;
  } catch (err) {
    throw new Error(
      `Invalid FIDES_WP_EXPORT_JSON: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

export async function loadExportPayload(wpUrl: string, secret: string): Promise<WpExportPayload> {
  const inline = loadInlineExportPayload();
  if (inline) {
    console.log('Using inline export payload (WordPress push sync).');
    return inline;
  }

  const event = process.env.GITHUB_EVENT_NAME?.trim();
  if (event === 'repository_dispatch') {
    throw new Error(
      'Missing FIDES_WP_EXPORT_JSON on repository_dispatch. '
      + 'Enable GitHub push sync in WP Settings → FIDES Catalog SEO, or run recovery via workflow_dispatch.',
    );
  }

  console.log(
    event === 'workflow_dispatch'
      ? 'Recovery sync: pulling export via HTTP (manual workflow).'
      : 'Pulling export via HTTP.',
  );
  return fetchWpExport(wpUrl, secret);
}

async function readExistingCatalog(slug: string): Promise<Record<string, unknown> | null> {
  const filePath = path.join(COMMUNITY_DIR, slug, COMMUNITY_FILENAME);
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw) as Record<string, unknown>;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw err;
  }
}

async function markerExists(slug: string): Promise<boolean> {
  try {
    await fs.access(path.join(COMMUNITY_DIR, slug, MARKER_FILENAME));
    return true;
  } catch {
    return false;
  }
}

export async function applyImportPlan(
  entries: WpExportEntry[],
  plan: ImportPlan,
  apply: boolean,
  catalogType = 'organization',
): Promise<WpSubmissionState> {
  const entryBySlug = new Map(entries.map((entry) => [entry.slug, entry]));
  const managedSlugs: string[] = [];

  for (const item of plan.write) {
    const entry = entryBySlug.get(item.slug);
    if (!entry) {
      continue;
    }
    let document = normalizeDocument(entry);
    const existing = await readExistingCatalog(item.slug);
    const qtspMerge = Boolean(existing && hasQtspCertification(existing));
    if (qtspMerge && existing) {
      document = mergeQtspCertifications(document, existing);
    }

    const dir = path.join(COMMUNITY_DIR, item.slug);
    const catalogPath = path.join(dir, COMMUNITY_FILENAME);
    const markerPath = path.join(dir, MARKER_FILENAME);
    const marker = {
      source: 'wordpress',
      itemId: entry.itemId,
      slug: entry.slug,
      publishedAt: entry.publishedAt ?? null,
      importedAt: new Date().toISOString(),
    };

    if (apply) {
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(catalogPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
      await fs.writeFile(markerPath, `${JSON.stringify(marker, null, 2)}\n`, 'utf8');
    }

    managedSlugs.push(item.slug);
    const mergeNote = qtspMerge ? ' (QTSP certifications preserved)' : '';
    console.log(`${apply ? 'WRITE' : 'DRY '} ${item.slug} -> ${path.relative(ROOT, catalogPath)}${mergeNote}`);
  }

  for (const slug of plan.prune) {
    const dir = path.join(COMMUNITY_DIR, slug);
    const hasMarker = await markerExists(slug);
    if (!hasMarker) {
      console.log(`SKIP  prune ${slug} — not WP-managed (no ${MARKER_FILENAME})`);
      continue;
    }
    if (apply) {
      await fs.rm(dir, { recursive: true, force: true });
    }
    console.log(`${apply ? 'PRUNE' : 'DRY '} ${slug}`);
  }

  for (const skipped of plan.skipped) {
    console.log(`SKIP  ${skipped.slug} — ${skipped.reason}`);
  }

  return {
    schemaVersion: '1.0.0',
    catalogType,
    lastImportAt: apply ? new Date().toISOString() : null,
    managedSlugs: apply ? managedSlugs.sort() : managedSlugs,
  };
}

async function main() {
  const { apply, wpUrl, secret } = parseArgs(process.argv.slice(2));
  console.log(`WP export: ${wpUrl}`);
  console.log(`Mode: ${apply ? 'apply' : 'dry-run (pass --apply to write)'}`);

  const previousState = await readState();
  const payload = await loadExportPayload(wpUrl, secret);
  const plan = buildImportPlan(payload.entries, previousState);

  console.log(`Export entries: ${payload.entries.length}`);
  console.log(`Would write: ${plan.write.length}, prune: ${plan.prune.length}, skipped: ${plan.skipped.length}`);

  const nextState = await applyImportPlan(
    payload.entries,
    plan,
    apply,
    payload.catalogType || 'organization',
  );
  if (apply) {
    nextState.catalogType = payload.catalogType || 'organization';
    nextState.lastImportAt = new Date().toISOString();
    await fs.mkdir(path.dirname(STATE_PATH), { recursive: true });
    await fs.writeFile(STATE_PATH, `${JSON.stringify(nextState, null, 2)}\n`, 'utf8');
    console.log(`State updated: ${path.relative(ROOT, STATE_PATH)}`);
  }

  if (!apply && (plan.write.length > 0 || plan.prune.length > 0)) {
    console.log('\nRe-run with --apply to write files.');
  }
}

const isMain = process.argv[1]
  ? fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  : false;
if (isMain) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
