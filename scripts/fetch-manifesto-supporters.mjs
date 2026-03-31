/**
 * Reads a WordPress page JSON export and fetches media titles from the REST API.
 *
 * Usage:
 *   curl -sL "https://fides.community/wp-json/wp/v2/pages/7" -o manifesto-page.json
 *   node scripts/fetch-manifesto-supporters.mjs manifesto-page.json
 */
import fs from 'fs';
import path from 'path';

const PAGE_JSON = path.resolve(process.argv[2] || '');
if (!PAGE_JSON || !fs.existsSync(PAGE_JSON)) {
  console.error('Usage: node scripts/fetch-manifesto-supporters.mjs <wp-page-export.json>');
  process.exit(1);
}

const j = JSON.parse(fs.readFileSync(PAGE_JSON, 'utf8'));
const html = j.content.rendered;
const seen = new Set();
const items = [];
for (const m of html.matchAll(/<img[^>]*>/g)) {
  const tag = m[0];
  const id = (tag.match(/data-id="(\d+)"/) || [])[1];
  const src = (tag.match(/src="([^"]+)"/) || [])[1];
  if (!id || !src || !src.includes('uploads') || seen.has(id)) continue;
  seen.add(id);
  const filename = src.split('/').pop().split('?')[0];
  items.push({ mediaId: id, filename, src });
}

const SKIP_FILENAME = (fn) =>
  /^1x1_FFFFFF/i.test(fn) || /^1x1_#FFFFFF/i.test(fn) || fn.includes('FFFFFF');

async function fetchMedia(id) {
  const url = `https://fides.community/wp-json/wp/v2/media/${id}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${id} ${res.status}`);
  return res.json();
}

const results = [];
for (const it of items) {
  if (SKIP_FILENAME(it.filename)) continue;
  try {
    const m = await fetchMedia(it.mediaId);
    const title = (m.title?.rendered || '').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
    const alt = m.alt_text || '';
    results.push({
      mediaId: it.mediaId,
      wpTitle: title || it.filename,
      altText: alt,
      filename: it.filename,
    });
  } catch (e) {
    results.push({
      mediaId: it.mediaId,
      wpTitle: '(fetch failed)',
      altText: String(e),
      filename: it.filename,
    });
  }
  await new Promise((r) => setTimeout(r, 80));
}

results.sort((a, b) => a.wpTitle.localeCompare(b.wpTitle, 'en', { sensitivity: 'base' }));
console.log(JSON.stringify(results, null, 2));
