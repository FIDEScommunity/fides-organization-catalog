/**
 * UIDAI OVSE list helpers: parse the public PDF text, normalize names,
 * and match against existing organization-catalog records.
 */

export const UIDAI_OVSE_LANDING_URL = 'https://uidai.gov.in/en/ovse';
export const UIDAI_OVSE_EVIDENCE_LABEL =
  'UIDAI registered Offline Verification Seeking Entity';
export const UIDAI_OVSE_CERT_CODE = 'uidai_ovse';

export const DEFAULT_PDF_URL =
  'https://backend.uidai.gov.in/get/files/media/document/2026-09/List_of_Registered_Offline_Verification_Seeking_Entity_OVSE.pdf';

/** Known catalog slugs for names that do not match after suffix-stripping. */
export const MANUAL_SLUG_ALIASES = {
  'ayanworks technology solutions': 'ayanworks',
  'arattai technology solutions': 'arattai',
};

const LEGAL_SUFFIX_RE = new RegExp(
  [
    '\\bprivate\\s+limited\\b',
    '\\bpvt\\.?\\s*ltd\\.?\\b',
    '\\blimited\\b',
    '\\bltd\\.?\\b',
    '\\bllp\\b',
    '\\bopc\\b',
    '\\binc\\.?\\b',
  ].join('|'),
  'gi',
);

const PUBLIC_SECTOR_RE =
  /\b(police|ministry|department|government|council|authority|commission|office of|defence|defense|municipal|reserve|corporation ltd|state electronics|informatics centre)\b/i;

export function slugify(value) {
  const ascii = String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  return ascii.slice(0, 80);
}

export function normalizeOrgName(value) {
  return String(value || '')
    .replace(LEGAL_SUFFIX_RE, ' ')
    .replace(/[.,()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function displayNameFromLegal(legalName) {
  const stripped = String(legalName || '')
    .replace(LEGAL_SUFFIX_RE, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return stripped || String(legalName || '').trim();
}

export function guessSectors(name) {
  return PUBLIC_SECTOR_RE.test(name) ? ['public_sector'] : ['digital'];
}

export function ovseDescription(legalName) {
  const label = String(legalName || '').trim() || 'This organization';
  return `${label} is a registered Offline Verification Seeking Entity (OVSE) with the Unique Identification Authority of India (UIDAI), authorised to request Aadhaar verifiable credentials for offline identity verification.`;
}

/**
 * Parse the first UIDAI table (registered OVSEs) from extracted PDF text.
 * Stops at Sub-AUA / AUA lists that are bundled in the same file.
 */
export function parseOvseNamesFromText(rawText) {
  const text = String(rawText || '').replace(/\r/g, '\n');
  const lines = text.split('\n').map((line) => line.replace(/\s+/g, ' ').trim());
  const names = [];
  let current = null;

  const isStopLine = (line) =>
    /^list of sub[-\s]?aua/i.test(line) ||
    /^list of aua/i.test(line) ||
    /^list of kua/i.test(line);

  const isHeader = (line) =>
    !line ||
    /^list of registered/i.test(line) ||
    /^as on\b/i.test(line) ||
    /^si\.?\s*no/i.test(line) ||
    /^entity name$/i.test(line) ||
    /^--\s*\d+\s+of\s+\d+\s*--$/i.test(line) ||
    /^\d+\s+of\s+\d+$/i.test(line);

  for (const line of lines) {
    if (isStopLine(line)) break;
    if (isHeader(line)) continue;
    const numbered = line.match(/^(\d{1,4})\s+(.+)$/);
    if (numbered) {
      if (current) names.push(current);
      current = numbered[2].trim();
      continue;
    }
    if (current && /[A-Za-z]/.test(line) && !/^\d+$/.test(line)) {
      current = `${current} ${line}`.replace(/\s+/g, ' ').trim();
    }
  }
  if (current) names.push(current);

  const seen = new Set();
  const unique = [];
  for (const name of names) {
    const key = normalizeOrgName(name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(name);
  }
  return dropShorterPrefixDuplicates(unique);
}

/** Drop "Hyperverge" when "Hyperverge Technologies Private Limited" is also listed. */
export function dropShorterPrefixDuplicates(names) {
  const keys = names.map((name) => normalizeOrgName(name));
  const drop = new Set();
  for (let i = 0; i < keys.length; i++) {
    for (let j = 0; j < keys.length; j++) {
      if (i === j) continue;
      const a = keys[i];
      const b = keys[j];
      if (!a || !b || a === b) continue;
      if (b.startsWith(`${a} `) && a.length < b.length) drop.add(i);
    }
  }
  return names.filter((_, i) => !drop.has(i));
}

export function ovseCertification() {
  return {
    code: UIDAI_OVSE_CERT_CODE,
    evidence: {
      kind: 'url',
      url: UIDAI_OVSE_LANDING_URL,
      label: UIDAI_OVSE_EVIDENCE_LABEL,
    },
  };
}

export function buildIndex(orgDocs) {
  const bySlug = new Map();
  const byNormalizedName = new Map();
  for (const doc of orgDocs) {
    const org = doc.organization || {};
    const slug = String(org.id || '').replace(/^org:/, '');
    if (!slug) continue;
    const record = { slug, org, doc };
    bySlug.set(slug, record);
    for (const value of [org.name, org.legalName]) {
      const key = normalizeOrgName(value);
      if (key && !byNormalizedName.has(key)) byNormalizedName.set(key, record);
    }
  }
  return { bySlug, byNormalizedName };
}

export function matchExistingOrg(legalName, index) {
  const normalized = normalizeOrgName(legalName);
  if (!normalized) return { kind: 'none' };

  const aliasSlug = MANUAL_SLUG_ALIASES[normalized];
  if (aliasSlug && index.bySlug.has(aliasSlug)) {
    return { kind: 'match', record: index.bySlug.get(aliasSlug), reason: 'alias' };
  }

  if (index.byNormalizedName.has(normalized)) {
    return {
      kind: 'match',
      record: index.byNormalizedName.get(normalized),
      reason: 'normalized-name',
    };
  }

  const slug = slugify(normalized);
  if (slug && index.bySlug.has(slug)) {
    return { kind: 'match', record: index.bySlug.get(slug), reason: 'slug' };
  }

  return { kind: 'none' };
}

export function applyOvseToExisting(doc) {
  const next = structuredClone(doc);
  const org = next.organization && typeof next.organization === 'object' ? next.organization : {};
  const certs = Array.isArray(org.certifications) ? [...org.certifications] : [];
  const idx = certs.findIndex((c) => c && c.code === UIDAI_OVSE_CERT_CODE);
  const cert = ovseCertification();
  if (idx >= 0) certs[idx] = cert;
  else certs.push(cert);
  org.certifications = certs;

  const roles = Array.isArray(org.ecosystemRoleCodes) ? [...org.ecosystemRoleCodes] : [];
  if (!roles.includes('relying_party')) roles.push('relying_party');
  org.ecosystemRoleCodes = roles;
  next.organization = org;

  const before = structuredClone(doc);
  delete before.lastUpdated;
  const after = structuredClone(next);
  delete after.lastUpdated;
  const changed = JSON.stringify(before) !== JSON.stringify(after);
  return { changed, json: changed ? next : doc };
}

export function removeOvseFromExisting(doc) {
  const next = structuredClone(doc);
  const org = next.organization && typeof next.organization === 'object' ? next.organization : {};
  const certs = Array.isArray(org.certifications) ? org.certifications : [];
  const nextCerts = certs.filter((c) => !(c && c.code === UIDAI_OVSE_CERT_CODE));
  if (nextCerts.length === certs.length) {
    return { changed: false, json: doc };
  }
  if (nextCerts.length) org.certifications = nextCerts;
  else delete org.certifications;
  next.organization = org;
  return { changed: true, json: next };
}

export function buildNewOvseOrganization({ slug, legalName }) {
  const name = displayNameFromLegal(legalName);
  return {
    $schema: 'https://fides.community/schemas/organization-catalog/v1',
    organization: {
      id: `org:${slug}`,
      name,
      legalName,
      sectors: guessSectors(legalName),
      country: 'IN',
      description: ovseDescription(legalName),
      certifications: [ovseCertification()],
      ecosystemRoleCodes: ['relying_party'],
      catalogTier: 'Community',
    },
    lastUpdated: new Date().toISOString(),
  };
}

export function allocateSlug(baseSlug, reserved) {
  if (baseSlug && !reserved.has(baseSlug)) return baseSlug;
  let n = 2;
  for (;;) {
    const candidate = `${baseSlug}-${n}`;
    if (!reserved.has(candidate)) return candidate;
    n += 1;
  }
}

export function monthlyPdfUrl(date = new Date()) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `https://backend.uidai.gov.in/get/files/media/document/${year}-${month}/List_of_Registered_Offline_Verification_Seeking_Entity_OVSE.pdf`;
}
