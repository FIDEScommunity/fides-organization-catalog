/**
 * Link checker: validates all website/logo URLs in community-catalog entries.
 * Usage: npm run check-links
 */

import fs from 'fs/promises';
import path from 'path';

const ROOT = path.resolve(process.cwd());
const SOURCE_DIR = path.join(ROOT, 'community-catalogs');
const REPORT_DIR = path.join(ROOT, 'data');
const REPORT_JSON_PATH = path.join(REPORT_DIR, 'linkcheck-report.json');
const REPORT_MD_PATH = path.join(REPORT_DIR, 'linkcheck-summary.md');

interface LinkResult {
  org: string;
  field: string;
  url: string;
  ok: boolean;
  status?: number;
  error?: string;
}

interface LinkcheckReport {
  runAt: string;
  totalUrls: number;
  brokenCount: number;
  broken: LinkResult[];
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

    const data = JSON.parse(raw) as {
      organization: {
        website?: string;
        logo?: string;
        media?: { videos?: string[]; images?: string[] };
      };
    };
    const org = data.organization;

    for (const [field, url] of Object.entries({ website: org.website, logo: org.logo })) {
      if (!url) continue;
      const result = await checkUrl(url);
      results.push({ org: dirName, field, url, ...result });
      const icon = result.ok ? '\u2713' : '\u2717';
      const detail = result.error || `${result.status}`;
      console.log(`  ${icon} ${dirName} ${field}: ${detail}`);
    }

    const mediaVideos = org.media?.videos ?? [];
    const mediaImages = org.media?.images ?? [];
    for (const [index, url] of mediaVideos.entries()) {
      if (!url) continue;
      const result = await checkUrl(url);
      results.push({ org: dirName, field: `media.videos[${index}]`, url, ...result });
      const icon = result.ok ? '\u2713' : '\u2717';
      const detail = result.error || `${result.status}`;
      console.log(`  ${icon} ${dirName} media.videos[${index}]: ${detail}`);
    }
    for (const [index, url] of mediaImages.entries()) {
      if (!url) continue;
      const result = await checkUrl(url);
      results.push({ org: dirName, field: `media.images[${index}]`, url, ...result });
      const icon = result.ok ? '\u2713' : '\u2717';
      const detail = result.error || `${result.status}`;
      console.log(`  ${icon} ${dirName} media.images[${index}]: ${detail}`);
    }
  }

  const broken = results.filter((r) => !r.ok);
  console.log(`\n${results.length} links checked, ${broken.length} broken.`);

  if (broken.length > 0) {
    console.log('\nBroken links:');
    for (const b of broken) {
      console.log(`  - ${b.org} ${b.field}: ${b.url} (${b.error || b.status})`);
    }
  }

  const report: LinkcheckReport = {
    runAt: new Date().toISOString(),
    totalUrls: results.length,
    brokenCount: broken.length,
    broken,
  };

  await fs.mkdir(REPORT_DIR, { recursive: true });
  await fs.writeFile(REPORT_JSON_PATH, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`Report written to ${REPORT_JSON_PATH}`);

  const mdLines: string[] = [];
  mdLines.push(`# Organization catalog linkcheck - ${report.runAt.slice(0, 10)}`);
  mdLines.push('');
  mdLines.push(`- **Total URLs checked:** ${report.totalUrls}`);
  mdLines.push(`- **Broken:** ${report.brokenCount}`);
  mdLines.push('');
  if (broken.length > 0) {
    mdLines.push('## Broken links');
    mdLines.push('');
    mdLines.push('| Organization | Field | URL | Status |');
    mdLines.push('| --- | --- | --- | --- |');
    for (const b of broken) {
      const status = b.error ? `error: ${b.error}` : `${b.status ?? 'unknown'}`;
      mdLines.push(`| ${b.org} | ${b.field} | ${b.url} | ${status} |`);
    }
  } else {
    mdLines.push('All links OK.');
  }
  mdLines.push('');
  const markdownSummary = mdLines.join('\n');
  await fs.writeFile(REPORT_MD_PATH, markdownSummary, 'utf-8');
  console.log(`Summary written to ${REPORT_MD_PATH}`);

  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) {
    await fs.appendFile(summaryPath, markdownSummary);
  }
}

main().catch((err) => {
  console.error('Check-links failed:', err);
  process.exit(1);
});
