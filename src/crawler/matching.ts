/**
 * Organization matching utilities.
 * Kept in a separate module for testability.
 */

export function normalizeOrgName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'");
}

export function matchesByName(orgName: string, candidateName: string): boolean {
  return normalizeOrgName(orgName) === normalizeOrgName(candidateName);
}

/**
 * True when org display name is the catalog provider name plus a role/suffix,
 * e.g. "European Commission - Government" matches provider "European Commission".
 * Avoids matching "European Union" to "European" (suffix must start with separator).
 */
export function orgNameExtendsProvider(orgName: string, providerName: string): boolean {
  const o = normalizeOrgName(orgName);
  const p = normalizeOrgName(providerName);
  if (p.length < 4) return false;
  if (!o.startsWith(p)) return false;
  if (o.length === p.length) return true;
  const rest = o.slice(p.length);
  return /^(\s+[-–—]|\s*\(|,\s)/.test(rest);
}

function catalogProviderMatchesOrg(
  orgName: string,
  legalName: string | undefined,
  providerName: string,
): boolean {
  const tryDisplay = (display: string) =>
    matchesByName(display, providerName) || orgNameExtendsProvider(display, providerName);
  if (tryDisplay(orgName)) return true;
  if (legalName && tryDisplay(legalName)) return true;
  return false;
}

export function matchesByDid(
  orgDid: string | undefined,
  candidateDid: string | undefined,
): boolean {
  if (!orgDid || !candidateDid) return false;
  return orgDid === candidateDid;
}

/**
 * Extract the org-code part from an org ID (e.g. "org:animo" -> "animo").
 */
export function orgCodeFromId(orgId: string): string {
  return orgId.replace(/^org:/, '');
}

/**
 * Issuer catalog entry IDs use issuer:<org-code>:… (e.g. issuer:animo:bundesdruckerei:test).
 * Use the second segment to match community org directory / org:id when display names differ
 * (e.g. "Animo Solutions" vs issuer organization.name "Animo").
 */
export function orgCodeFromIssuerId(issuerId: string): string | undefined {
  const parts = issuerId.split(':').filter(Boolean);
  if (parts.length < 2 || parts[0].toLowerCase() !== 'issuer') return undefined;
  return parts[1].toLowerCase();
}

/**
 * Credential catalog IDs: cred:<org-code>:… (e.g. cred:ewc:pda1-sd-jwt:sd-jwt-vc).
 * Provider display names often differ from the organization catalog name (e.g. "University of the Aegean / EWC").
 */
export function orgCodeFromCredentialId(credentialId: string): string | undefined {
  const parts = credentialId.split(':').filter(Boolean);
  if (parts.length < 2 || parts[0].toLowerCase() !== 'cred') return undefined;
  return parts[1].toLowerCase();
}

/**
 * Try to match an organization against a provider/organization entry
 * from another catalog. Returns true on any positive signal.
 */
export function matchesOrganization(
  org: { name: string; did?: string; id: string; legalName?: string },
  candidate: { name: string; did?: string; dirName?: string },
): boolean {
  if (matchesByDid(org.did, candidate.did)) return true;
  if (catalogProviderMatchesOrg(org.name, org.legalName, candidate.name)) return true;
  if (candidate.dirName && orgCodeFromId(org.id) === candidate.dirName.toLowerCase()) return true;
  return false;
}
