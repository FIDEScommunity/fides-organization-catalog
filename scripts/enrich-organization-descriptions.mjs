#!/usr/bin/env node
/**
 * Fills missing organization.description by fetching each organization's website
 * and reading og:description / meta description / twitter:description.
 *
 * Usage: node scripts/enrich-organization-descriptions.mjs [--dry-run]
 *
 * Optional: place scripts/org-description-overrides.json as { "org:id": "text", ... }
 * to set or override descriptions without scraping.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, '..');
const OVERRIDES_PATH = path.join(__dirname, 'org-description-overrides.json');

const MIN_DESC_LEN = 20;
const MAX_DESC_LEN = 380;
const FETCH_TIMEOUT_MS = 12_000;
const MAX_BYTES = 256 * 1024;
const CONCURRENCY = 4;
const DRY_RUN = process.argv.includes('--dry-run');

const UA =
  'Mozilla/5.0 (compatible; FIDES-OrgCatalogBot/1.0; +https://fides.community; enrichment script)';

function walkJsonFiles(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walkJsonFiles(p));
    else if (ent.name === 'organization-catalog.json') out.push(p);
  }
  return out;
}

function decodeHtmlEntities(raw) {
  let s = raw.replace(/\s+/g, ' ').trim();
  const named = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>' };
  s = s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, inner) => {
    if (inner[0] === '#') {
      const code = inner[1] === 'x' ? parseInt(inner.slice(2), 16) : parseInt(inner.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return named[inner.toLowerCase()] ?? m;
  });
  return s.replace(/\s+/g, ' ').trim();
}

function pickDescription(html) {
  const patterns = [
    /<meta[^>]+property=["']og:description["'][^>]*content=["']([^"']*)["']/i,
    /<meta[^>]+content=["']([^"']*)["'][^>]*property=["']og:description["']/i,
    /<meta[^>]+name=["']twitter:description["'][^>]*content=["']([^"']*)["']/i,
    /<meta[^>]+content=["']([^"']*)["'][^>]*name=["']twitter:description["']/i,
    /<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i,
    /<meta[^>]+content=["']([^"']*)["'][^>]*name=["']description["']/i,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) {
      const t = decodeHtmlEntities(m[1]);
      if (t.length >= MIN_DESC_LEN) return t;
    }
  }
  return null;
}

function truncate(s) {
  if (s.length <= MAX_DESC_LEN) return s;
  const cut = s.slice(0, MAX_DESC_LEN);
  const last = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf(' '));
  return (last > 120 ? cut.slice(0, last) : cut).trim() + '…';
}

async function fetchHtml(url) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ac.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    const reader = res.body?.getReader();
    if (!reader) return { error: 'no body' };
    const dec = new TextDecoder();
    let buf = '';
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      buf += dec.decode(value, { stream: true });
      if (total >= MAX_BYTES) break;
    }
    return { html: buf };
  } catch (e) {
    return { error: e.name === 'AbortError' ? 'timeout' : String(e.message || e) };
  } finally {
    clearTimeout(t);
  }
}

function loadOverrides() {
  try {
    const raw = fs.readFileSync(OVERRIDES_PATH, 'utf8');
    const j = JSON.parse(raw);
    return typeof j === 'object' && j !== null ? j : {};
  } catch {
    return {};
  }
}

function needsDescription(org) {
  const d = org.description;
  return typeof d !== 'string' || d.trim().length < MIN_DESC_LEN;
}

async function poolMap(items, limit, fn) {
  const ret = new Array(items.length);
  let i = 0;
  async function worker() {
    for (;;) {
      const idx = i++;
      if (idx >= items.length) return;
      ret[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return ret;
}

async function main() {
  const overrides = loadOverrides();
  const files = walkJsonFiles(path.join(REPO_ROOT, 'community-catalogs'));
  const tasks = [];

  for (const file of files) {
    const raw = fs.readFileSync(file, 'utf8');
    const data = JSON.parse(raw);
    const org = data.organization;
    if (!org?.id) continue;
    if (!needsDescription(org) && !Object.prototype.hasOwnProperty.call(overrides, org.id)) {
      continue;
    }
    const fromOverride = overrides[org.id];
    if (typeof fromOverride === 'string' && fromOverride.trim().length >= MIN_DESC_LEN) {
      tasks.push({ file, data, org, mode: 'override', text: truncate(fromOverride.trim()) });
      continue;
    }
    if (!needsDescription(org)) continue;
    const web = org.website;
    if (typeof web !== 'string' || !web.startsWith('http')) {
      tasks.push({ file, data, org, mode: 'skip', reason: 'no website' });
      continue;
    }
    tasks.push({ file, data, org, mode: 'fetch', url: web });
  }

  const toFetch = tasks.filter((t) => t.mode === 'fetch');
  const results = await poolMap(toFetch, CONCURRENCY, async (task) => {
    const { html, error } = await fetchHtml(task.url);
    if (error) return { ...task, mode: 'failed', reason: error };
    const desc = html ? pickDescription(html) : null;
    if (!desc) return { ...task, mode: 'failed', reason: 'no meta description' };
    return { ...task, mode: 'ok', text: truncate(desc) };
  });

  const byFile = new Map();
  for (const t of tasks) {
    if (t.mode === 'override' || t.mode === 'skip') {
      byFile.set(t.file, t);
    }
  }
  for (const r of results) {
    byFile.set(r.file, r);
  }

  let updated = 0;
  let failed = 0;
  const failReport = [];

  for (const [file, task] of byFile) {
    if (task.mode === 'skip' && task.reason === 'no website') {
      failed += 1;
      failReport.push({
        id: task.org.id,
        name: task.org.name,
        url: task.org.website || null,
        reason: 'no website URL',
      });
      continue;
    }
    if (task.mode === 'skip') continue;
    if (task.mode === 'failed') {
      failed += 1;
      failReport.push({ id: task.org.id, name: task.org.name, url: task.url, reason: task.reason });
      continue;
    }
    if (task.mode !== 'ok' && task.mode !== 'override') continue;

    if (DRY_RUN) {
      console.log('[dry-run]', task.org.id, '→', task.text.slice(0, 100) + (task.text.length > 100 ? '…' : ''));
      updated += 1;
      continue;
    }

    task.data.organization = { ...task.data.organization, description: task.text };
    fs.writeFileSync(file, JSON.stringify(task.data, null, 2) + '\n', 'utf8');
    updated += 1;
  }

  console.log(
    JSON.stringify(
      { dryRun: DRY_RUN, filesConsidered: byFile.size, writtenOrDry: updated, fetchFailed: failed },
      null,
      2,
    ),
  );
  if (failReport.length) {
    console.error('\nStill need manual description (override or edit JSON):');
    for (const row of failReport) {
      console.error(`  ${row.id} | ${row.name} | ${row.url || '—'} | ${row.reason}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
