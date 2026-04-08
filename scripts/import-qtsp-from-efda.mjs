#!/usr/bin/env node
/**
 * One-off import of EU QTSPs from the EFDA trusted-list JSON API.
 *
 * Sources:
 *   GET https://eidas.ec.europa.eu/efda/api/v2/browse/eidas/tl/backbone
 *   GET https://eidas.ec.europa.eu/efda/api/v2/browse/eidas/tl/tl/{CC}
 *
 * Includes a TSP only if it has at least one service with:
 *   - serviceLegalTypes containing a string starting with "Q_" (qualified), and
 *   - active === true
 *
 * By default runs in dry-run mode (no writes). Pass --apply to create files.
 *
 * Usage:
 *   node scripts/import-qtsp-from-efda.mjs --dry-run
 *   node scripts/import-qtsp-from-efda.mjs --dry-run --countries NL,DE
 *   node scripts/import-qtsp-from-efda.mjs --apply
 */

import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");
const CATALOGS_DIR = join(REPO_ROOT, "community-catalogs");

const EFDA_API = "https://eidas.ec.europa.eu/efda/api/v2";
const DASHBOARD_TSP_BASE =
  "https://eidas.ec.europa.eu/efda/trust-services/browse/eidas/tls/tl";

/** ISO 3166-1 alpha-2 -> preferred language for legal/trade name */
const TERRITORY_LANG = {
  AT: "de",
  BE: "nl",
  BG: "bg",
  HR: "hr",
  CY: "el",
  CZ: "cs",
  DK: "da",
  EE: "et",
  FI: "fi",
  FR: "fr",
  DE: "de",
  GR: "el",
  HU: "hu",
  IE: "en",
  IS: "is",
  IT: "it",
  LV: "lv",
  LI: "de",
  LT: "lt",
  LU: "fr",
  MT: "mt",
  NL: "nl",
  NO: "no",
  PL: "pl",
  PT: "pt",
  RO: "ro",
  SK: "sk",
  SI: "sl",
  ES: "es",
  SE: "sv",
  CH: "de",
  UK: "en",
  GB: "en",
  XI: "en",
};

const LEGAL_SUFFIX_PATTERN = new RegExp(
  [
    "\\bGmbH\\s*&\\s*Co\\.\\s*KGaA\\b",
    "\\bGmbH\\s*&\\s*Co\\.\\s*KG\\b",
    "\\bGmbH\\b",
    "\\be\\.\\s*K\\.\\b",
    "\\bUG\\b",
    "\\bAG\\b",
    "\\bKG\\b",
    "\\bOHG\\b",
    "\\bB\\.?V\\.?\\b",
    "\\bN\\.?V\\.?\\b",
    "\\bS\\.?A\\.?\\b",
    "\\bS\\.?A\\.?R\\.?L\\.?\\b",
    "\\bS\\.?A\\.?S\\.?\\b",
    "\\bS\\.?L\\.?\\b",
    "\\bS\\.?L\\.?U\\.?\\b",
    "\\bLtd\\.?\\b",
    "\\bLimited\\b",
    "\\bPLC\\b",
    "\\bLLP\\b",
    "\\bLP\\b",
    "\\bInc\\.?\\b",
    "\\bCorp\\.?\\b",
    "\\bCorporation\\b",
    "\\bAB\\b",
    "\\bOy\\b",
    "\\bOyj\\b",
    "\\bApS\\b",
    "\\bA/S\\b",
    "\\bAS\\b",
    "\\bSp\\.?\\s*z\\s*o\\.?\\s*o\\.?\\b",
    "\\bS\\.?p\\.?A\\.?\\b",
    "\\bS\\.?r\\.?l\\.?\\b",
    "\\bBVBA\\b",
    "\\bSPRL\\b",
    "\\beG\\b",
    "\\bS\\.?E\\.?\\b",
    "\\bSE\\b",
    "\\bEEIG\\b",
    "\\bEOOD\\b",
    "\\bJSC\\b",
    "\\bJ\\.S\\.C\\.\\b",
    "\\bAD\\b",
    "\\bАД\\b",
    "\\bd\\.\\s*o\\.\\s*o\\.\\b",
    "\\bd\\.d\\.\\b",
    "\\bD\\.D\\.\\b",
    "\\bspol\\.\\s*s\\s*r\\.?\\s*o\\.?\\b",
    "\\bs\\.\\s*r\\.\\s*o\\.\\b",
    "\\bs\\.p\\.\\b",
    "\\ba\\.\\s*s\\.\\b",
    "\\ba\\.s\\.\\b",
    "\\b&\\s*Co\\.\\s*KG\\b",
  ].join("|"),
  "gi",
);

function parseArgs(argv) {
  const out = {
    apply: false,
    dryRun: true,
    countries: null,
    limitCountries: null,
    limitTsps: null,
    delayMs: 350,
    help: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--apply") {
      out.apply = true;
      out.dryRun = false;
    } else if (a === "--dry-run") out.dryRun = true;
    else if (a === "--countries" && argv[i + 1]) {
      i++;
      out.countries = argv[i]
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);
    } else if (a.startsWith("--countries="))
      out.countries = a.slice("--countries=".length).split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
    else if (a === "--limit-countries" && argv[i + 1]) {
      i++;
      out.limitCountries = Number(argv[i]);
    } else if (a.startsWith("--limit-countries="))
      out.limitCountries = Number(a.slice("--limit-countries=".length));
    else if (a === "--limit-tsps" && argv[i + 1]) {
      i++;
      out.limitTsps = Number(argv[i]);
    } else if (a.startsWith("--limit-tsps="))
      out.limitTsps = Number(a.slice("--limit-tsps=".length));
    else if (a === "--delay-ms" && argv[i + 1]) {
      i++;
      out.delayMs = Number(argv[i]);
    } else if (a.startsWith("--delay-ms="))
      out.delayMs = Number(a.slice("--delay-ms=".length));
  }
  if (out.apply) out.dryRun = false;
  return out;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} ${url}`);
  return res.json();
}

function isQualifiedService(svc) {
  const types = svc.serviceLegalTypes || [];
  return types.some((t) => typeof t === "string" && t.startsWith("Q_"));
}

function isActiveService(svc) {
  if (Object.prototype.hasOwnProperty.call(svc, "active"))
    return Boolean(svc.active);
  return true;
}

function hasActiveQualified(sp) {
  const services = sp.services || [];
  return services.some((s) => isQualifiedService(s) && isActiveService(s));
}

function pickNameForLang(names, lang) {
  if (!names?.length) return null;
  const hit = names.find((n) => n.language === lang && n.value?.trim());
  if (hit) return hit.value.trim();
  return null;
}

function legalNameFromTsp(names, territoryCode) {
  const preferred = TERRITORY_LANG[territoryCode] || "en";
  return (
    pickNameForLang(names, preferred) ||
    pickNameForLang(names, "en") ||
    (names[0]?.value || "").trim() ||
    "Unknown"
  );
}

function englishDisplayName(names) {
  return pickNameForLang(names, "en") || (names[0]?.value || "").trim() || "Unknown";
}

function stripLegalSuffixes(s) {
  let t = s.replace(LEGAL_SUFFIX_PATTERN, " ");
  t = t.replace(/\s*,\s*$/, "").replace(/\s+/g, " ").trim();
  t = t.replace(/^[\s,;-]+|[\s,;-]+$/g, "").trim();
  t = cleanupDisplayName(t);
  return t || cleanupDisplayName(s.trim());
}

/** Remove punctuation artifacts common in TL English names (e.g. "Zetes ./ ."). */
function cleanupDisplayName(s) {
  return s
    .replace(/\s*\.\s*\/\s*\.?\s*$/g, "")
    .replace(/\s*\/\s*$/g, "")
    .replace(/\s+\.\s*$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function slugify(s) {
  const ascii = s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return ascii.slice(0, 80);
}

function firstWebsiteUrl(electronicAddresses) {
  if (!electronicAddresses?.length) return null;
  const https = electronicAddresses
    .map((e) => (e.value || "").trim())
    .find((v) => /^https:\/\//i.test(v));
  if (https) return https;
  const http = electronicAddresses
    .map((e) => (e.value || "").trim())
    .find((v) => /^https?:\/\//i.test(v));
  return http || null;
}

function normalizeEvidenceUrl(u) {
  if (!u) return "";
  return u.replace(/\.+$/, "").replace(/\/+$/, "");
}

async function loadExistingEidasEvidenceUrls() {
  const urls = new Set();
  const dirs = await readdir(CATALOGS_DIR, { withFileTypes: true });
  for (const d of dirs) {
    if (!d.isDirectory()) continue;
    const p = join(CATALOGS_DIR, d.name, "organization-catalog.json");
    try {
      const raw = await readFile(p, "utf8");
      const j = JSON.parse(raw);
      const certs = j.organization?.certifications || [];
      for (const c of certs) {
        const u = c?.evidence?.url;
        if (typeof u === "string" && u.includes("eidas.ec.europa.eu/efda/trust-services/browse/eidas/tls"))
          urls.add(normalizeEvidenceUrl(u));
      }
    } catch {
      // missing or invalid — ignore
    }
  }
  return urls;
}

function buildOrganizationPayload({
  slug,
  name,
  legalName,
  website,
  country,
  evidenceUrl,
}) {
  const org = {
    id: `org:${slug}`,
    name,
    legalName,
    sectors: ["digital"],
    country,
    certifications: [
      {
        code: "qtsp",
        evidence: {
          kind: "url",
          url: evidenceUrl,
          label: "EU eIDAS Trust List (Qualified Trust Service Provider)",
        },
      },
    ],
  };
  if (website) org.website = website;
  return {
    $schema: "https://fides.community/schemas/organization-catalog/v1",
    organization: org,
    lastUpdated: new Date().toISOString(),
  };
}

/** Pick first unused slug for this import run (and avoid clashing with reserved slugs). */
function allocateSlug(baseSlug, cc, tspIndex, reservedSlugs) {
  const candidates = [
    baseSlug,
    slugify(`qtsp-${cc}-${tspIndex}-${baseSlug}`),
    `qtsp-${cc.toLowerCase()}-${tspIndex}`,
  ];
  for (const s of candidates) {
    if (s && !reservedSlugs.has(s)) return s;
  }
  let n = 2;
  for (;;) {
    const s = `${baseSlug}-${n}`;
    if (!reservedSlugs.has(s)) return s;
    n++;
  }
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(`import-qtsp-from-efda.mjs

  --dry-run              Do not write files (default when --apply is omitted)
  --apply                Write organization-catalog.json files
  --countries=NL,DE      Only these territory codes
  --limit-countries=N    Stop after N countries (after filter)
  --limit-tsps=N         Stop after N new catalog entries (dry-run or apply)
  --delay-ms=N           Pause between country fetches (default 350)
`);
    process.exit(0);
  }

  console.log(
    args.dryRun
      ? "Mode: DRY-RUN (no files written). Use --apply to write."
      : "Mode: APPLY (writing files).",
  );

  const existingEvidence = await loadExistingEidasEvidenceUrls();
  console.log(`Loaded ${existingEvidence.size} existing eIDAS TL evidence URL(s) from current catalogs.`);

  const backbone = await fetchJson(`${EFDA_API}/browse/eidas/tl/backbone`);
  let tlsList = backbone.tls || [];
  if (args.countries?.length)
    tlsList = tlsList.filter((t) => args.countries.includes(t.territoryCode));
  tlsList = tlsList.filter(
    (t) =>
      t.tlType === "TL" &&
      typeof t.territoryCode === "string" &&
      /^[A-Z]{2}$/.test(t.territoryCode),
  );

  if (args.limitCountries && Number.isFinite(args.limitCountries))
    tlsList = tlsList.slice(0, args.limitCountries);

  let created = 0;
  let skippedExistingDir = 0;
  let skippedExistingEvidence = 0;
  let skippedNoWebsite = 0;
  /** Slugs reserved by this run (created or skipped because folder already exists). */
  const reservedSlugs = new Set();
  let tspCounter = 0;

  for (const tl of tlsList) {
    const cc = tl.territoryCode;
    const tlUrl = `${EFDA_API}/browse/eidas/tl/tl/${cc}`;
    await sleep(args.delayMs);
    let tlDoc;
    try {
      tlDoc = await fetchJson(tlUrl);
    } catch (e) {
      console.warn(`Skip ${cc}: failed to fetch TL (${e.message})`);
      continue;
    }
    const providers = tlDoc.serviceProviders || [];
    for (let i = 0; i < providers.length; i++) {
      const sp = providers[i];
      const tspIndex = i + 1;
      if (!hasActiveQualified(sp)) continue;

      const names = sp.names || [];
      const legalName = legalNameFromTsp(names, cc);
      const enRaw = englishDisplayName(names);
      const displayName = stripLegalSuffixes(enRaw);

      const evidenceUrl = `${DASHBOARD_TSP_BASE}/${cc}/tsp/${tspIndex}`;
      const evidenceNorm = normalizeEvidenceUrl(evidenceUrl);

      if (existingEvidence.has(evidenceNorm)) {
        skippedExistingEvidence++;
        console.log(`SKIP evidence ${cc} tsp/${tspIndex} (${legalName}) — URL already in catalog`);
        continue;
      }

      let baseSlug = slugify(displayName);
      if (baseSlug.length < 2) baseSlug = `qtsp-${cc.toLowerCase()}-${tspIndex}`;

      const slug = allocateSlug(baseSlug, cc, tspIndex, reservedSlugs);

      const dirPath = join(CATALOGS_DIR, slug);
      const filePath = join(dirPath, "organization-catalog.json");

      try {
        await readFile(filePath, "utf8");
        skippedExistingDir++;
        reservedSlugs.add(slug);
        console.log(`SKIP dir ${slug} (${cc} tsp/${tspIndex}) — organization-catalog.json exists`);
        continue;
      } catch {
        // does not exist — proceed
      }

      const website = firstWebsiteUrl(sp.electronicAddresses);
      if (!website) {
        skippedNoWebsite++;
        console.warn(`WARN no http(s) website ${cc} tsp/${tspIndex} (${legalName}) — entry without website field`);
      }

      const payload = buildOrganizationPayload({
        slug,
        name: displayName,
        legalName,
        website,
        country: cc,
        evidenceUrl,
      });

      reservedSlugs.add(slug);
      tspCounter++;
      if (args.dryRun) {
        console.log(`WOULD CREATE ${filePath}`);
        console.log(`  id=${payload.organization.id} name=${JSON.stringify(payload.organization.name)} legalName=${JSON.stringify(legalName)}`);
      } else {
        await mkdir(dirPath, { recursive: true });
        await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
        console.log(`CREATED ${filePath}`);
        created++;
      }

      if (args.limitTsps && tspCounter >= args.limitTsps) break;
    }
    if (args.limitTsps && tspCounter >= args.limitTsps) break;
  }

  console.log("\nSummary:");
  console.log(`  ${args.dryRun ? "Would create" : "Created"}: ${args.dryRun ? tspCounter : created}`);
  console.log(`  Skipped (dir exists): ${skippedExistingDir}`);
  console.log(`  Skipped (evidence URL already in catalog): ${skippedExistingEvidence}`);
  console.log(`  Warn (no website): ${skippedNoWebsite}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
