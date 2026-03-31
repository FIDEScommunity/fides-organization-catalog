/**
 * Report organization display names in the org catalog vs names used in
 * wallet / issuer / credential / RP aggregated data for matched entries.
 *
 * Run: npx tsx scripts/report-org-name-differences.ts
 */

import fs from 'fs';
import path from 'path';
import { matchesOrganization, normalizeOrgName } from '../src/crawler/matching.js';

const ROOT = path.resolve(process.cwd());

const PATHS = {
  orgAggregated: path.join(ROOT, 'data', 'aggregated.json'),
  wallet: path.resolve(ROOT, '..', 'wallet-catalog', 'data', 'aggregated.json'),
  issuer: path.resolve(ROOT, '..', 'issuer-catalog', 'data', 'aggregated.json'),
  credential: path.resolve(ROOT, '..', 'credential-catalog', 'data', 'aggregated.json'),
  rp: path.resolve(ROOT, '..', 'rp-catalog', 'data', 'aggregated.json'),
};

type OrgRow = { id: string; name: string; legalName?: string; identifiers?: { did?: string } };

function loadJson<T>(p: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8')) as T;
  } catch {
    return null;
  }
}

function sameLabel(a: string, b: string): boolean {
  return normalizeOrgName(a) === normalizeOrgName(b);
}

/** External name is "different" if it is not equal to org.name or org.legalName (normalized). */
function externalDiffersFromOrg(org: OrgRow, external: string): boolean {
  if (sameLabel(external, org.name)) return false;
  if (org.legalName && sameLabel(external, org.legalName)) return false;
  return true;
}

function main() {
  const orgData = loadJson<{ organizations: OrgRow[] }>(PATHS.orgAggregated);
  if (!orgData?.organizations?.length) {
    console.error('Missing or empty', PATHS.orgAggregated);
    process.exit(1);
  }

  const walletData = loadJson<{ wallets?: Array<{ id: string; name: string; type: string; provider: { name: string; did?: string } }> }>(PATHS.wallet);
  const issuerData = loadJson<{ issuers?: Array<{ organization: { name: string; did?: string } }> }>(PATHS.issuer);
  const credData = loadJson<{
    credentials?: Array<{
      provider: { name: string; did?: string };
      authority?: { name?: string };
    }>;
  }>(PATHS.credential);
  const rpData = loadJson<{ relyingParties?: Array<{ provider: { name: string; did?: string } }> }>(PATHS.rp);

  const wallets = walletData?.wallets || [];
  const issuers = issuerData?.issuers || [];
  const credentials = credData?.credentials || [];
  const rps = rpData?.relyingParties || [];

  type Source = 'wallet' | 'issuer' | 'credential (provider)' | 'credential (authority)' | 'rp';
  const rows: Array<{
    orgId: string;
    orgName: string;
    legalName?: string;
    source: Source;
    externalNames: string[];
  }> = [];

  for (const org of orgData.organizations) {
    const orgForMatch = { id: org.id, name: org.name, legalName: org.legalName, did: org.identifiers?.did };

    const walletNames = new Set<string>();
    for (const w of wallets) {
      if (matchesOrganization(orgForMatch, { name: w.provider.name, did: w.provider.did })) {
        if (externalDiffersFromOrg(org, w.provider.name)) walletNames.add(w.provider.name);
      }
    }
    if (walletNames.size) {
      rows.push({
        orgId: org.id,
        orgName: org.name,
        legalName: org.legalName,
        source: 'wallet',
        externalNames: [...walletNames].sort(),
      });
    }

    const issuerNames = new Set<string>();
    for (const i of issuers) {
      if (matchesOrganization(orgForMatch, { name: i.organization.name, did: i.organization.did })) {
        if (externalDiffersFromOrg(org, i.organization.name)) issuerNames.add(i.organization.name);
      }
    }
    if (issuerNames.size) {
      rows.push({
        orgId: org.id,
        orgName: org.name,
        legalName: org.legalName,
        source: 'issuer',
        externalNames: [...issuerNames].sort(),
      });
    }

    const provNames = new Set<string>();
    const authNames = new Set<string>();
    for (const c of credentials) {
      if (matchesOrganization(orgForMatch, { name: c.provider.name, did: c.provider.did })) {
        if (externalDiffersFromOrg(org, c.provider.name)) provNames.add(c.provider.name);
        const an = c.authority?.name;
        if (an && externalDiffersFromOrg(org, an)) authNames.add(an);
      }
    }
    if (provNames.size) {
      rows.push({
        orgId: org.id,
        orgName: org.name,
        legalName: org.legalName,
        source: 'credential (provider)',
        externalNames: [...provNames].sort(),
      });
    }
    if (authNames.size) {
      rows.push({
        orgId: org.id,
        orgName: org.name,
        legalName: org.legalName,
        source: 'credential (authority)',
        externalNames: [...authNames].sort(),
      });
    }

    const rpNames = new Set<string>();
    for (const r of rps) {
      if (matchesOrganization(orgForMatch, { name: r.provider.name, did: r.provider.did })) {
        if (externalDiffersFromOrg(org, r.provider.name)) rpNames.add(r.provider.name);
      }
    }
    if (rpNames.size) {
      rows.push({
        orgId: org.id,
        orgName: org.name,
        legalName: org.legalName,
        source: 'rp',
        externalNames: [...rpNames].sort(),
      });
    }
  }

  console.log('# Organization names vs other catalogs (matched entries only)\n');
  console.log(
    'Listed when a **linked** wallet/issuer/credential/RP uses a provider or organization name that is not equal (after normalization) to the org catalog `name` or `legalName`.\n',
  );

  if (rows.length === 0) {
    console.log('No differences found (all matched external names align with org `name` or `legalName`).\n');
  } else {
    rows.sort((a, b) => a.orgName.localeCompare(b.orgName) || a.source.localeCompare(b.source));

    let current = '';
    for (const r of rows) {
      const header = `## ${r.orgName} (\`${r.orgId}\`)`;
      if (r.orgName !== current) {
        console.log(header);
        if (r.legalName) console.log(`- **legalName (org catalog):** ${r.legalName}`);
        current = r.orgName;
      }
      console.log(`- **${r.source}:** ${r.externalNames.map((n) => `"${n}"`).join(', ')}`);
    }

    console.log('\n---\n');
    console.log(`**Total mismatch rows:** ${rows.length} (same org may appear under multiple sources)\n`);
  }

  // Credential: provider vs authority internal drift (same credential object)
  const credDrift: Array<{ provider: string; authority: string }> = [];
  for (const c of credentials) {
    const p = c.provider?.name;
    const a = c.authority?.name;
    if (p && a && !sameLabel(p, a)) {
      credDrift.push({ provider: p, authority: a });
    }
  }
  if (credDrift.length) {
    const uniq = new Map<string, { provider: string; authority: string }>();
    for (const x of credDrift) {
      const k = `${normalizeOrgName(x.provider)}|${normalizeOrgName(x.authority)}`;
      if (!uniq.has(k)) uniq.set(k, x);
    }
    console.log('## Credential catalog: provider.name ≠ authority.name (unique pairs)\n');
    for (const x of [...uniq.values()].sort((a, b) => a.provider.localeCompare(b.provider))) {
      console.log(`- provider: "${x.provider}" → authority: "${x.authority}"`);
    }
    console.log(
      '_These strings may refer to two different entities (e.g. host vs issuer); only align them if they are the same organization._\n',
    );
  }

  // Same DID must use one canonical label across org catalog + wallet + RP (where DID is present).
  type DidRef = { label: string; ref: string };
  const byDid = new Map<string, DidRef[]>();
  function pushDid(did: string | undefined, label: string | undefined, ref: string) {
    if (!did || !label?.trim()) return;
    if (!byDid.has(did)) byDid.set(did, []);
    byDid.get(did)!.push({ label, ref });
  }
  for (const o of orgData.organizations) {
    const od = o.identifiers?.did;
    if (od) {
      pushDid(od, o.name, `org ${o.id} name`);
      if (o.legalName) pushDid(od, o.legalName, `org ${o.id} legalName`);
    }
  }
  for (const w of wallets) {
    pushDid(w.provider?.did, w.provider?.name, `wallet ${w.id} provider`);
  }
  for (const r of rps) {
    pushDid(r.provider?.did, r.provider?.name, `rp ${r.id} provider`);
  }
  const didConflicts: Array<{ did: string; norms: Map<string, string[]> }> = [];
  for (const [did, refs] of byDid) {
    const norms = new Map<string, string[]>();
    for (const { label } of refs) {
      const k = normalizeOrgName(label);
      if (!norms.has(k)) norms.set(k, []);
      if (!norms.get(k)!.includes(label)) norms.get(k)!.push(label);
    }
    if (norms.size > 1) didConflicts.push({ did, norms });
  }
  console.log('## DID: multiple normalized labels for the same DID (org + wallet + RP)\n');
  if (didConflicts.length === 0) {
    console.log('None (all DIDs use a single normalized name across these sources).\n');
  } else {
    didConflicts.sort((a, b) => a.did.localeCompare(b.did));
    for (const { did, norms } of didConflicts) {
      console.log(`- \`${did}\``);
      for (const variants of norms.values()) {
        console.log(`  - ${variants.map((v) => `"${v}"`).join(' | ')}`);
      }
    }
    console.log('');
  }
}

main();
