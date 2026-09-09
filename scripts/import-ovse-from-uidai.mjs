#!/usr/bin/env node
/**
 * Import UIDAI Offline Verification Seeking Entities (OVSEs) into the
 * organization catalog.
 *
 * Source: UIDAI's public registered-OVSE PDF (first table only).
 * Default: dry-run. Pass --apply to write files.
 *
 * Usage:
 *   node scripts/import-ovse-from-uidai.mjs
 *   node scripts/import-ovse-from-uidai.mjs --apply
 *   node scripts/import-ovse-from-uidai.mjs --file=/path/to/list.pdf
 *   node scripts/import-ovse-from-uidai.mjs --url=https://...
 */

import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  DEFAULT_PDF_URL,
  UIDAI_OVSE_CERT_CODE,
  UIDAI_OVSE_LANDING_URL,
  allocateSlug,
  applyOvseToExisting,
  buildIndex,
  buildNewOvseOrganization,
  matchExistingOrg,
  monthlyPdfUrl,
  parseOvseNamesFromText,
  removeOvseFromExisting,
  slugify,
  normalizeOrgName,
} from './lib/ovseFromUidai.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const CATALOGS_DIR = join(REPO_ROOT, 'community-catalogs');

const DISCOVERY_PAGES = [
  UIDAI_OVSE_LANDING_URL,
  'https://uidai.gov.in/en/ovse-registration.html',
];

function parseArgs(argv) {
  const out = { apply: false, dryRun: true, file: '', url: '', help: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') out.help = true;
    else if (a === '--apply') {
      out.apply = true;
      out.dryRun = false;
    } else if (a === '--dry-run') out.dryRun = true;
    else if (a === '--file' && argv[i + 1]) {
      i += 1;
      out.file = argv[i];
    } else if (a.startsWith('--file=')) out.file = a.slice('--file='.length);
    else if (a === '--url' && argv[i + 1]) {
      i += 1;
      out.url = argv[i];
    } else if (a.startsWith('--url=')) out.url = a.slice('--url='.length);
  }
  if (out.apply) out.dryRun = false;
  return out;
}

function runCommand(command, args, input) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    const stdout = [];
    const stderr = [];
    child.stdout.on('data', (chunk) => stdout.push(chunk));
    child.stderr.on('data', (chunk) => stderr.push(chunk));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve(Buffer.concat(stdout).toString('utf8'));
      else reject(new Error(`${command} exited ${code}: ${Buffer.concat(stderr).toString('utf8').slice(0, 400)}`));
    });
    if (input) child.stdin.end(input);
    else child.stdin.end();
  });
}

async function extractPdfText(buffer) {
  try {
    const { extractText, getDocumentProxy } = await import('unpdf');
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const extracted = await extractText(pdf, { mergePages: true });
    const text = extracted && extracted.text;
    if (Array.isArray(text)) return text.join('\n');
    if (typeof text === 'string' && text.trim()) return text;
  } catch (err) {
    console.warn(`unpdf extract failed (${err.message}); trying pdftotext`);
  }
  const tmpPdf = join(tmpdir(), `fides-ovse-${Date.now()}.pdf`);
  await writeFile(tmpPdf, buffer);
  return runCommand('pdftotext', ['-layout', '-nopgbrk', tmpPdf, '-']);
}

async function fetchBuffer(url, { attempts = 3 } = {}) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          Accept: 'application/pdf,text/html;q=0.9,*/*;q=0.8',
          'User-Agent': 'FIDES-Catalog-Automation/1.0 (+https://fides.community)',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(60000),
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText} ${url}`);
      const bytes = new Uint8Array(await res.arrayBuffer());
      return { bytes: Buffer.from(bytes), contentType: res.headers.get('content-type') || '', finalUrl: res.url };
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) {
        console.warn(`Fetch retry ${i + 1}/${attempts - 1} for ${url}: ${err.message}`);
      }
    }
  }
  throw lastErr;
}

function extractPdfHref(html) {
  const matches = String(html || '').matchAll(/https?:\/\/[^"' \s>]+OVSE[^"' \s>]*\.pdf/gi);
  for (const match of matches) {
    const url = match[0].replace(/&amp;/g, '&');
    if (/registered/i.test(url) || /list_of_registered/i.test(url)) return url;
  }
  const alt = String(html || '').match(/https?:\/\/[^"' \s>]+List_of_Registered[^"' \s>]+\.pdf/i);
  return alt ? alt[0].replace(/&amp;/g, '&') : '';
}

async function discoverPdfUrl() {
  for (const page of DISCOVERY_PAGES) {
    try {
      const { bytes, contentType } = await fetchBuffer(page);
      if (/pdf/i.test(contentType)) return page;
      const href = extractPdfHref(bytes.toString('utf8'));
      if (href) return href;
    } catch (err) {
      console.warn(`Discovery skip ${page}: ${err.message}`);
    }
  }
  const currentMonth = monthlyPdfUrl();
  try {
    const head = await fetch(currentMonth, { method: 'HEAD', redirect: 'follow' });
    if (head.ok) return currentMonth;
  } catch {
    /* fall through */
  }
  return DEFAULT_PDF_URL;
}

async function loadCatalogIndex() {
  const dirs = await readdir(CATALOGS_DIR, { withFileTypes: true });
  const docs = [];
  const reserved = new Set();
  for (const d of dirs) {
    if (!d.isDirectory()) continue;
    reserved.add(d.name);
    const path = join(CATALOGS_DIR, d.name, 'organization-catalog.json');
    try {
      const raw = await readFile(path, 'utf8');
      const json = JSON.parse(raw);
      json.__path = path;
      json.__slug = d.name;
      docs.push(json);
    } catch {
      /* ignore missing/invalid */
    }
  }
  return { docs, reserved, index: buildIndex(docs) };
}

async function writeCatalog(path, json) {
  const dir = dirname(path);
  await mkdir(dir, { recursive: true });
  const payload = { ...json };
  delete payload.__path;
  delete payload.__slug;
  await writeFile(path, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(`import-ovse-from-uidai.mjs

  --dry-run     Do not write files (default)
  --apply       Write organization-catalog.json files
  --file=PATH   Local PDF or .txt extract
  --url=URL     Explicit PDF URL (skips discovery)
`);
    process.exit(0);
  }

  console.log(args.dryRun ? 'Mode: DRY-RUN (no files written). Use --apply to write.' : 'Mode: APPLY (writing files).');

  let text = '';
  let sourceLabel = '';
  if (args.file) {
    sourceLabel = args.file;
    const buf = await readFile(args.file);
    text = /\.txt$/i.test(args.file) ? buf.toString('utf8') : await extractPdfText(buf);
  } else {
    const url = args.url || (await discoverPdfUrl());
    sourceLabel = url;
    console.log(`Fetching ${url}`);
    const { bytes, contentType } = await fetchBuffer(url);
    if (/pdf/i.test(contentType) || bytes.slice(0, 5).toString() === '%PDF-') {
      text = await extractPdfText(bytes);
    } else {
      text = bytes.toString('utf8');
    }
  }

  const names = parseOvseNamesFromText(text);
  if (names.length < 20) {
    throw new Error(`Parsed only ${names.length} OVSE names from ${sourceLabel}; refusing to continue (expected the registered-OVSE table).`);
  }
  console.log(`Parsed ${names.length} unique OVSE names from ${sourceLabel}`);

  const { docs, reserved, index } = await loadCatalogIndex();
  const matchedSlugs = new Set();
  const summary = { match: [], create: [], skip: [] };

  for (const legalName of names) {
    const found = matchExistingOrg(legalName, index);
    if (found.kind === 'match') {
      matchedSlugs.add(found.record.slug);
      const { changed, json } = applyOvseToExisting(found.record.doc);
      summary.match.push({ legalName, slug: found.record.slug, reason: found.reason, changed });
      if (changed && args.apply) await writeCatalog(found.record.doc.__path, json);
      continue;
    }
    const baseSlug = slugify(normalizeOrgName(legalName)) || slugify(legalName);
    const slug = allocateSlug(baseSlug, reserved);
    reserved.add(slug);
    summary.create.push({ legalName, slug });
    if (args.apply) {
      const payload = buildNewOvseOrganization({ slug, legalName });
      await writeCatalog(join(CATALOGS_DIR, slug, 'organization-catalog.json'), payload);
    }
  }

  const currentKeys = new Set(names.map((n) => normalizeOrgName(n)));
  const stale = [];
  for (const doc of docs) {
    const org = doc.organization || {};
    const slug = doc.__slug || String(org.id || '').replace(/^org:/, '');
    const certs = Array.isArray(org.certifications) ? org.certifications : [];
    const hasOvse = certs.some((c) => c && c.code === UIDAI_OVSE_CERT_CODE);
    if (!hasOvse || matchedSlugs.has(slug)) continue;
    const stillListed = currentKeys.has(normalizeOrgName(org.name)) || currentKeys.has(normalizeOrgName(org.legalName));
    if (stillListed) continue;
    const { changed, json } = removeOvseFromExisting(doc);
    if (!changed) continue;
    stale.push(slug);
    if (args.apply) await writeCatalog(doc.__path, json);
  }

  console.log(`\nMatches: ${summary.match.length} (changed ${summary.match.filter((m) => m.changed).length})`);
  for (const row of summary.match) {
    console.log(`  MATCH ${row.slug} ← ${row.legalName} [${row.reason}]${row.changed ? '' : ' (unchanged)'}`);
  }
  console.log(`\nCreate: ${summary.create.length}`);
  for (const row of summary.create) {
    console.log(`  NEW   ${row.slug} ← ${row.legalName}`);
  }
  if (stale.length) {
    console.log(`\nRemove OVSE cert (entity left the list): ${stale.length}`);
    for (const slug of stale) console.log(`  DROP  ${slug}`);
  }
  console.log(`\nSource: ${sourceLabel}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
