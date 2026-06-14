#!/usr/bin/env node
/**
 * Scaling gate checker for Organization Catalog payload growth.
 *
 * This script measures current aggregated.json size (raw + gzip),
 * estimates linear growth for a target item count, and classifies
 * the state as green/orange/red using agreed thresholds.
 *
 * Usage:
 *   node scripts/check-scaling-gates.mjs
 *   node scripts/check-scaling-gates.mjs --target-count=400
 *   node scripts/check-scaling-gates.mjs --file=data/aggregated.json --target-count=600
 */

import { readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { resolve } from "node:path";

const DEFAULT_FILE = "data/aggregated.json";
const DEFAULT_TARGET_COUNT = 400;

const THRESHOLDS = {
  greenMaxGzipKb: 300,
  orangeMaxGzipKb: 700,
};

function parseArgs(argv) {
  const out = {
    file: DEFAULT_FILE,
    targetCount: DEFAULT_TARGET_COUNT,
  };

  for (const arg of argv.slice(2)) {
    if (arg.startsWith("--file=")) {
      out.file = arg.slice("--file=".length);
    } else if (arg.startsWith("--target-count=")) {
      const n = Number(arg.slice("--target-count=".length));
      if (Number.isFinite(n) && n > 0) out.targetCount = n;
    }
  }
  return out;
}

function kb(bytes) {
  return bytes / 1024;
}

function mb(bytes) {
  return bytes / (1024 * 1024);
}

function classifyByGzipKb(gzipKbValue) {
  if (gzipKbValue < THRESHOLDS.greenMaxGzipKb) return "green";
  if (gzipKbValue <= THRESHOLDS.orangeMaxGzipKb) return "orange";
  return "red";
}

function statusText(status) {
  if (status === "green") return "GREEN (current setup is fine)";
  if (status === "orange")
    return "ORANGE (add/keep client-side load-more and monitor)";
  return "RED (move to server-side paging/filtering)";
}

function printSection(title) {
  console.log(`\n=== ${title} ===`);
}

async function main() {
  const args = parseArgs(process.argv);
  const filePath = resolve(args.file);

  const raw = await readFile(filePath);
  const gz = gzipSync(raw, { level: 9 });
  const payload = JSON.parse(raw.toString("utf8"));
  const count = Array.isArray(payload.organizations)
    ? payload.organizations.length
    : 0;

  if (count === 0) {
    console.error(
      "No organizations found in aggregated payload; cannot compute scaling gates.",
    );
    process.exit(1);
  }

  const bytesPerOrg = raw.length / count;
  const gzipBytesPerOrg = gz.length / count;

  const projectedRaw = Math.round(bytesPerOrg * args.targetCount);
  const projectedGzip = Math.round(gzipBytesPerOrg * args.targetCount);

  const currentStatus = classifyByGzipKb(kb(gz.length));
  const projectedStatus = classifyByGzipKb(kb(projectedGzip));

  printSection("Input");
  console.log(`File: ${filePath}`);
  console.log(`Organizations: ${count}`);
  console.log(`Target count: ${args.targetCount}`);

  printSection("Current Payload");
  console.log(`Raw:  ${raw.length} bytes (${kb(raw.length).toFixed(1)} KB / ${mb(raw.length).toFixed(3)} MB)`);
  console.log(`Gzip: ${gz.length} bytes (${kb(gz.length).toFixed(1)} KB / ${mb(gz.length).toFixed(3)} MB)`);
  console.log(`Gate status: ${statusText(currentStatus)}`);

  printSection(`Projected Payload (linear, ${args.targetCount} orgs)`);
  console.log(`Raw:  ~${projectedRaw} bytes (${kb(projectedRaw).toFixed(1)} KB / ${mb(projectedRaw).toFixed(3)} MB)`);
  console.log(`Gzip: ~${projectedGzip} bytes (${kb(projectedGzip).toFixed(1)} KB / ${mb(projectedGzip).toFixed(3)} MB)`);
  console.log(`Gate status: ${statusText(projectedStatus)}`);

  printSection("Thresholds");
  console.log(`Green  : gzip < ${THRESHOLDS.greenMaxGzipKb} KB`);
  console.log(
    `Orange : gzip ${THRESHOLDS.greenMaxGzipKb}-${THRESHOLDS.orangeMaxGzipKb} KB`,
  );
  console.log(`Red    : gzip > ${THRESHOLDS.orangeMaxGzipKb} KB`);

  printSection("Recommended Next Step");
  if (projectedStatus === "green") {
    console.log(
      "Stay client-side; keep monitoring each release and optimize DOM rendering with load-more.",
    );
  } else if (projectedStatus === "orange") {
    console.log(
      "Keep/introduce client-side load-more now; plan server-side paging if runtime metrics degrade.",
    );
  } else {
    console.log(
      "Prioritize server-side paging/filtering API before adding much more catalog volume.",
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

