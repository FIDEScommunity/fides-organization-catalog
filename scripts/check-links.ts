/**
 * Link checker: validates all website/logo URLs in community-catalog entries.
 * Usage: npm run check-links
 */

import fs from 'fs/promises';
import path from 'path';

const ROOT = path.resolve(process.cwd());
const SOURCE_DIR = path.join(ROOT, 'community-catalogs');

interface LinkResult {
  org: string;
  field: string;
  url: string;
  ok: boolean;
  status?: number;
  error?: string;
}

async function checkUrl(url: string): Promise<{ ok: boolean; status?: number; error?: string }> {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(10_000),
      redirect: 'follow',
    });
    return { ok: res.ok, status: res.status };
  } catch (err) {
    try {
      const res = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(10_000),
        redirect: 'follow',
      });
      return { ok: res.ok, status: res.status };
    } catch (getErr) {
      return { ok: false, error: (getErr as Error).message };
    }
  }
}

async function main(): Promise<void> {
  const dirs = (await fs.readdir(SOURCE_DIR)).filter((d) => !d.startsWith('.'));
  const results: LinkResult[] = [];

  console.log(`Checking links for ${dirs.length} organizations...\n`);

  for (const dirName of dirs) {
    const filePath = path.join(SOURCE_DIR, dirName, 'organization-catalog.json');
    let raw: string;
    try {
      raw = await fs.readFile(filePath, 'utf-8');
    } catch {
      continue;
    }

    const data = JSON.parse(raw) as { organization: { website?: string; logo?: string } };
    const org = data.organization;

    for (const [field, url] of Object.entries({ website: org.website, logo: org.logo })) {
      if (!url) continue;
      const result = await checkUrl(url);
      results.push({ org: dirName, field, url, ...result });
      const icon = result.ok ? '\u2713' : '\u2717';
      const detail = result.error || `${result.status}`;
      console.log(`  ${icon} ${dirName} ${field}: ${detail}`);
    }
  }

  const broken = results.filter((r) => !r.ok);
  console.log(`\n${results.length} links checked, ${broken.length} broken.`);

  if (broken.length > 0) {
    console.log('\nBroken links:');
    for (const b of broken) {
      console.log(`  - ${b.org} ${b.field}: ${b.url} (${b.error || b.status})`);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Check-links failed:', err);
  process.exit(1);
});
