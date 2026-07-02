/**
 * Normalize organization contact to public export shape: email + optional bookMeetingUrl.
 */

export type LegacyOrgContact = {
  contactUrl?: string;
  bookMeetingUrl?: string;
  email?: string;
  support?: string;
};

export type OrgContact = {
  email?: string;
  bookMeetingUrl?: string;
};

export type OrgContactNormalizationResult = {
  contact?: OrgContact;
  changed: boolean;
  actions: string[];
};

const HTTP_URI = /^https?:\/\//i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function trim(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isHttpUri(value: string): boolean {
  return value !== '' && HTTP_URI.test(value);
}

function extractEmailFromMailto(value: string): string {
  const raw = value.trim();
  if (!raw.toLowerCase().startsWith('mailto:')) return '';
  try {
    return decodeURIComponent(raw.slice(7).split('?')[0]).trim();
  } catch {
    return raw.slice(7).split('?')[0].trim();
  }
}

function pickEmail(...candidates: string[]): string {
  for (const candidate of candidates) {
    const value = trim(candidate);
    if (value && EMAIL.test(value)) return value;
  }
  return '';
}

export function normalizeOrgContact(contact: unknown): OrgContactNormalizationResult {
  const actions: string[] = [];
  if (!contact || typeof contact !== 'object' || Array.isArray(contact)) {
    return { changed: false, actions };
  }

  const raw = contact as LegacyOrgContact;
  const out: OrgContact = {};
  const bookMeetingUrl = trim(raw.bookMeetingUrl);
  const contactUrl = trim(raw.contactUrl);
  const support = trim(raw.support);
  const legacyEmail = trim(raw.email);

  if (bookMeetingUrl) {
    out.bookMeetingUrl = bookMeetingUrl;
  }

  const email = pickEmail(
    legacyEmail,
    extractEmailFromMailto(contactUrl),
    EMAIL.test(support) ? support : '',
  );

  if (email) {
    out.email = email;
    if (legacyEmail && legacyEmail !== email) {
      actions.push('normalized-email');
    } else if (contactUrl && extractEmailFromMailto(contactUrl) === email) {
      actions.push('contactUrl→email');
    } else if (support === email) {
      actions.push('support→email');
    }
  }

  if (contactUrl && !extractEmailFromMailto(contactUrl) && isHttpUri(contactUrl)) {
    actions.push('dropped-http-contactUrl');
  } else if (contactUrl && !email) {
    actions.push('dropped-contactUrl');
  }

  if (support && support !== email && isHttpUri(support)) {
    actions.push('dropped-http-support');
  }

  const changed =
    contactUrl !== '' ||
    (legacyEmail !== '' && legacyEmail !== (out.email ?? '')) ||
    (support !== '' && support !== (out.email ?? '')) ||
    trim(raw.bookMeetingUrl) !== (out.bookMeetingUrl ?? '');

  if (Object.keys(out).length === 0) {
    if (changed) actions.push('removed-empty-contact');
    return { changed, actions };
  }

  return { contact: out, changed, actions };
}

export type OrgCatalogDocument = {
  $schema?: string;
  organization?: Record<string, unknown>;
  lastUpdated?: string;
};

export function migrateOrganizationCatalogDocument(
  doc: OrgCatalogDocument,
  nowIso = new Date().toISOString(),
): { doc: OrgCatalogDocument; changed: boolean; actions: string[] } {
  if (!doc.organization || typeof doc.organization !== 'object') {
    return { doc, changed: false, actions: [] };
  }

  const org = { ...doc.organization };
  const result = normalizeOrgContact(org.contact);

  if (!result.changed) {
    return { doc, changed: false, actions: [] };
  }

  if (result.contact) {
    org.contact = result.contact;
  } else {
    delete org.contact;
  }

  return {
    doc: {
      ...doc,
      organization: org,
      lastUpdated: nowIso,
    },
    changed: true,
    actions: result.actions,
  };
}

/** @deprecated Use normalizeOrgContact */
export const migrateOrgContact = normalizeOrgContact;
