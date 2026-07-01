/**
 * Migrate legacy organization contact fields (email, support) to contactUrl / bookMeetingUrl.
 */

export type LegacyOrgContact = {
  contactUrl?: string;
  bookMeetingUrl?: string;
  email?: string;
  support?: string;
};

export type OrgContactV2 = {
  contactUrl?: string;
  bookMeetingUrl?: string;
};

export type OrgContactMigrationResult = {
  contact?: OrgContactV2;
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

export function migrateOrgContact(contact: unknown): OrgContactMigrationResult {
  const actions: string[] = [];
  if (!contact || typeof contact !== 'object' || Array.isArray(contact)) {
    return { changed: false, actions };
  }

  const raw = contact as LegacyOrgContact;
  const out: OrgContactV2 = {};
  let contactUrl = trim(raw.contactUrl);
  const bookMeetingUrl = trim(raw.bookMeetingUrl);
  const support = trim(raw.support);
  const email = trim(raw.email);

  if (bookMeetingUrl) {
    out.bookMeetingUrl = bookMeetingUrl;
  }

  if (!contactUrl && support && isHttpUri(support)) {
    contactUrl = support;
    actions.push('support→contactUrl');
  } else if (support && support !== contactUrl) {
    actions.push('dropped-support');
  }

  if (!contactUrl && email && EMAIL.test(email)) {
    contactUrl = `mailto:${email}`;
    actions.push('email→mailto:contactUrl');
  } else if (email) {
    actions.push('dropped-email');
  }

  if (contactUrl) {
    out.contactUrl = contactUrl;
  }

  const changed =
    support !== '' ||
    email !== '' ||
    trim(raw.contactUrl) !== (out.contactUrl ?? '') ||
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
  const contact = org.contact;
  const result = migrateOrgContact(contact);

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
