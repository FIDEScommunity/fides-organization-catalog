#!/usr/bin/env node
/**
 * Fills missing organization.logo by inspecting each organization's website.
 *
 * Priority:
 *  1) scripts/org-logo-overrides.json (manual override)
 *  2) og:image / twitter:image
 *  3) <link rel="apple-touch-icon"> / icon links
 *  4) Google favicon fallback
 *
 * Usage:
 *   node scripts/enrich-organization-logos.mjs [--dry-run]
 *
 * Optional override file format:
 *   {
 *     "org:example": "https://example.com/logo.png"
 *   }
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, '..');
const OVERRIDES_PATH = path.join(__dirname, 'org-logo-overrides.json');

const FETCH_TIMEOUT_MS = 12_000;
const MAX_BYTES = 256 * 1024;
const CONCURRENCY = 4;
const DRY_RUN = process.argv.includes('--dry-run');

const UA =
  'Mozilla/5.0 (compatible; FIDES-OrgCatalogBot/1.0; +https://fides.community; logo enrichment)';

function walkJsonFiles(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walkJsonFiles(p));
    else if (ent.name === 'organization-catalog.json') out.push(p);
  }
  return out;
}

function isHttpUrl(value) {
  if (typeof value !== 'string') return false;
  try {
    const u = new URL(value.trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function normalizeHttpUrl(value) {
  if (!isHttpUrl(value)) return null;
  try {
    const u = new URL(value.trim());
    return u.toString();
  } catch {
    return null;
  }
}

function hasLogo(org) {
  return typeof org.logo === 'string' && org.logo.trim().length > 0;
}

function decodeHtmlEntities(raw) {
  let s = String(raw || '').replace(/\s+/g, ' ').trim();
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

function extractMetaContent(html, key) {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${key}["'][^>]*content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*property=["']${key}["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']${key}["'][^>]*content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*name=["']${key}["']`, 'i'),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return decodeHtmlEntities(m[1]);
  }
  return null;
}

function extractLinkHrefs(html, relNeedles) {
  const out = [];
  const re = /<link\b[^>]*>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const tag = m[0];
    const rel = (tag.match(/\brel=["']([^"']+)["']/i)?.[1] || '').toLowerCase();
    const href = tag.match(/\bhref=["']([^"']+)["']/i)?.[1];
    if (!href || !rel) continue;
    const relTokens = rel.split(/\s+/g);
    const matches = relNeedles.some((needle) => relTokens.includes(needle));
    if (!matches) continue;
    out.push(decodeHtmlEntities(href));
  }
  return out;
}

function resolveLogoCandidate(baseUrl, candidate) {
  if (!candidate || typeof candidate !== 'string') return null;
  const trimmed = candidate.trim();
  if (!trimmed || trimmed.startsWith('data:')) return null;
  try {
    return new URL(trimmed, baseUrl).toString();
  } catch {
    return null;
  }
}

function pickLogoUrl(html, websiteUrl) {
  const candidates = [];
  const push = (v) => {
    const resolved = resolveLogoCandidate(websiteUrl, v);
    if (resolved && !candidates.includes(resolved)) candidates.push(resolved);
  };

  push(extractMetaContent(html, 'og:image'));
  push(extractMetaContent(html, 'og:image:url'));
  push(extractMetaContent(html, 'twitter:image'));

  for (const href of extractLinkHrefs(html, ['apple-touch-icon'])) push(href);
  for (const href of extractLinkHrefs(html, ['icon', 'shortcut'])) push(href);

  for (const c of candidates) {
    if (isHttpUrl(c)) return c;
  }

  try {
    const u = new URL(websiteUrl);
    if (!u.hostname) return null;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(u.hostname)}&sz=128`;
  } catch {
    return null;
  }
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

    const overrideRaw = overrides[org.id];
    const overrideLogo = normalizeHttpUrl(overrideRaw);
    if (overrideRaw !== undefined) {
      if (overrideLogo) {
        tasks.push({ file, data, org, mode: 'override', logo: overrideLogo });
      } else {
        tasks.push({ file, data, org, mode: 'failed', reason: 'invalid override logo URL' });
      }
      continue;
    }

    if (hasLogo(org)) continue;

    const website = normalizeHttpUrl(org.website);
    if (!website) {
      tasks.push({ file, data, org, mode: 'failed', reason: 'no website URL' });
      continue;
    }

    tasks.push({ file, data, org, mode: 'fetch', website });
  }

  const fetchTasks = tasks.filter((t) => t.mode === 'fetch');
  const fetched = await poolMap(fetchTasks, CONCURRENCY, async (task) => {
    const { html, error } = await fetchHtml(task.website);
    if (error) return { ...task, mode: 'failed', reason: error };
    const logo = pickLogoUrl(html || '', task.website);
    if (!logo) return { ...task, mode: 'failed', reason: 'no logo candidate found' };
    return { ...task, mode: 'ok', logo };
  });

  const byFile = new Map();
  for (const t of tasks) {
    if (t.mode === 'override' || t.mode === 'failed') byFile.set(t.file, t);
  }
  for (const r of fetched) byFile.set(r.file, r);

  let updated = 0;
  let failed = 0;
  const failReport = [];

  for (const [file, task] of byFile) {
    if (task.mode === 'failed') {
      failed += 1;
      failReport.push({
        id: task.org.id,
        name: task.org.name,
        website: task.org.website || null,
        reason: task.reason,
      });
      continue;
    }
    if (task.mode !== 'ok' && task.mode !== 'override') continue;

    if (DRY_RUN) {
      console.log('[dry-run]', task.org.id, '→', task.logo);
      updated += 1;
      continue;
    }

    task.data.organization = { ...task.data.organization, logo: task.logo };
    fs.writeFileSync(file, JSON.stringify(task.data, null, 2) + '\n', 'utf8');
    updated += 1;
  }

  console.log(
    JSON.stringify(
      {
        dryRun: DRY_RUN,
        filesConsidered: byFile.size,
        writtenOrDry: updated,
        failed,
      },
      null,
      2,
    ),
  );

  if (failReport.length) {
    console.error('\nStill need manual logo (override or edit JSON):');
    for (const row of failReport) {
      console.error(`  ${row.id} | ${row.name} | ${row.website || '—'} | ${row.reason}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

