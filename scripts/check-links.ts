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
const REQUEST_TIMEOUT_MS = 12_000;
const DELAY_BETWEEN_REQUESTS_MS = 350;
const MAX_ATTEMPTS = 3;
const USER_AGENT =
  'Mozilla/5.0 (compatible; FIDES-Organization-Catalog-Linkcheck/1.0; +https://fides.community)';
const SOFT_OK_STATUSES = new Set([401, 403]);
const RETRY_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

interface LinkResult {
  org: string;
  field: string;
  url: string;
  ok: boolean;
  status?: number;
  error?: string;
  via?: string;
  softOk?: boolean;
}

interface SkippedEntry {
  org: string;
  field: string;
  url: string;
  reason: string;
}

interface LinkcheckReport {
  runAt: string;
  totalCatalogUrls: number;
  skippedCount: number;
  skipped?: SkippedEntry[];
  softOkCount: number;
  softOk?: Array<{ url: string; status: number }>;
  totalUrls: number;
  brokenCount: number;
  broken: LinkResult[];
}

function shouldSkipUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (
      (parsed.hostname === 'www.google.com' || parsed.hostname === 'google.com') &&
      parsed.pathname === '/s2/favicons'
    ) {
      return 'Google favicon helper URLs are excluded (often flaky for automated checks).';
    }
  } catch {
    return 'Invalid URL.';
  }
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithMethod(
  url: string,
  method: 'HEAD' | 'GET'
): Promise<{ ok: boolean; status: number; softOk: boolean }> {
  const headers: Record<string, string> = {
    'User-Agent': USER_AGENT,
    Accept: '*/*',
  };
  if (method === 'GET') headers.Range = 'bytes=0-0';

  const response = await fetch(url, {
    method,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    redirect: 'follow',
    headers,
  });

  const status = response.status;
  if (status >= 200 && status < 400) return { ok: true, status, softOk: false };
  if (SOFT_OK_STATUSES.has(status)) return { ok: true, status, softOk: true };
  return { ok: false, status, softOk: false };
}

function shouldRetryWithGetAfterHead(status: number | undefined): boolean {
  if (status === undefined) return true;
  return status === 400 || status === 403 || status === 404 || status === 405 || status === 406;
}

async function checkOnce(
  url: string
): Promise<{ ok: boolean; status?: number; error?: string; via?: string; softOk?: boolean }> {
  try {
    const head = await fetchWithMethod(url, 'HEAD');
    if (head.ok) return { ok: true, status: head.status, via: 'HEAD', softOk: head.softOk };
    if (!shouldRetryWithGetAfterHead(head.status)) {
      return { ok: false, status: head.status, error: `HTTP ${head.status}`, via: 'HEAD' };
    }
    const get = await fetchWithMethod(url, 'GET');
    if (get.ok) return { ok: true, status: get.status, via: 'GET', softOk: get.softOk };
    return {
      ok: false,
      status: get.status,
      error: `HTTP ${get.status} (HEAD was ${head.status})`,
      via: 'GET',
    };
  } catch (error) {
    const headError = error instanceof Error ? error.message : String(error);
    try {
      const get = await fetchWithMethod(url, 'GET');
      if (get.ok) return { ok: true, status: get.status, via: 'GET', softOk: get.softOk };
      return {
        ok: false,
        status: get.status,
        error: `${headError}; GET HTTP ${get.status}`,
        via: 'GET',
      };
    } catch (getError) {
      const message = getError instanceof Error ? getError.message : String(getError);
      return { ok: false, error: `${headError}; GET: ${message}` };
    }
  }
}

async function checkUrl(
  url: string
): Promise<{ ok: boolean; status?: number; error?: string; via?: string; softOk?: boolean }> {
  let last:
    | { ok: boolean; status?: number; error?: string; via?: string; softOk?: boolean }
    | undefined;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    last = await checkOnce(url);
    if (last.ok) return last;

    const retryable =
      last.status === undefined || (last.status !== undefined && RETRY_STATUSES.has(last.status));
    if (!retryable || attempt === MAX_ATTEMPTS) {
      if (last.status === 429 || last.status === 503) {
        return { ok: true, status: last.status, via: last.via, softOk: true };
      }
      return last;
    }
    await sleep(800 * attempt);
  }

  return last ?? { ok: false, error: 'Unknown error' };
}

async function main(): Promise<void> {
  const dirs = (await fs.readdir(SOURCE_DIR)).filter((d) => !d.startsWith('.'));
  const results: LinkResult[] = [];
  const skipped: SkippedEntry[] = [];
  let totalCatalogUrls = 0;

  console.log(`Checking links for ${dirs.length} organizations...\n`);

  const checkAndRecord = async (org: string, field: string, url: string): Promise<void> => {
    totalCatalogUrls++;
    const reason = shouldSkipUrl(url);
    if (reason) {
      skipped.push({ org, field, url, reason });
      console.log(`  - ${org} ${field}: skipped`);
      return;
    }

    const result = await checkUrl(url);
    results.push({ org, field, url, ...result });
    const icon = result.ok ? '\u2713' : '\u2717';
    const detail = result.error || `${result.status}`;
    console.log(`  ${icon} ${org} ${field}: ${detail}`);
    await sleep(DELAY_BETWEEN_REQUESTS_MS);
  };

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
      await checkAndRecord(dirName, field, url);
    }

    const mediaVideos = org.media?.videos ?? [];
    const mediaImages = org.media?.images ?? [];
    for (const [index, url] of mediaVideos.entries()) {
      if (!url) continue;
      await checkAndRecord(dirName, `media.videos[${index}]`, url);
    }
    for (const [index, url] of mediaImages.entries()) {
      if (!url) continue;
      await checkAndRecord(dirName, `media.images[${index}]`, url);
    }
  }

  const broken = results.filter((r) => !r.ok);
  const softOk = results
    .filter((result) => result.ok && result.softOk && result.status !== undefined)
    .map((result) => ({ url: result.url, status: result.status! }));
  console.log(
    `\n${totalCatalogUrls} catalog links, ${skipped.length} skipped, ${results.length} checked, ${broken.length} broken.`
  );

  if (broken.length > 0) {
    console.log('\nBroken links:');
    for (const b of broken) {
      console.log(`  - ${b.org} ${b.field}: ${b.url} (${b.error || b.status})`);
    }
  }

  const report: LinkcheckReport = {
    runAt: new Date().toISOString(),
    totalCatalogUrls,
    skippedCount: skipped.length,
    skipped: skipped.length > 0 ? skipped : undefined,
    softOkCount: softOk.length,
    softOk: softOk.length > 0 ? softOk : undefined,
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
  mdLines.push(`- **Catalog URLs collected:** ${report.totalCatalogUrls}`);
  if (report.skippedCount > 0) mdLines.push(`- **Skipped (excluded):** ${report.skippedCount}`);
  mdLines.push(`- **URLs checked:** ${report.totalUrls}`);
  if (report.softOkCount > 0) {
    mdLines.push(`- **Soft-OK (401/403/429/503 soft):** ${report.softOkCount}`);
  }
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
