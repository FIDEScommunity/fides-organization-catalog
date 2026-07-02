import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeOrgContact,
  migrateOrganizationCatalogDocument,
} from './normalize-org-contact.ts';

describe('normalizeOrgContact', () => {
  it('keeps a valid public email', () => {
    const result = normalizeOrgContact({ email: 'hello@example.com' });
    assert.equal(result.contact?.email, 'hello@example.com');
    assert.equal(result.changed, false);
  });

  it('extracts email from mailto contactUrl', () => {
    const result = normalizeOrgContact({ contactUrl: 'mailto:support@igrant.io' });
    assert.equal(result.contact?.email, 'support@igrant.io');
    assert.ok(result.actions.includes('contactUrl→email'));
  });

  it('maps legacy support email to contact.email', () => {
    const result = normalizeOrgContact({ support: 'support-wallet@namirial.com' });
    assert.equal(result.contact?.email, 'support-wallet@namirial.com');
    assert.ok(result.actions.includes('support→email'));
  });

  it('drops http contactUrl when no email is available', () => {
    const result = normalizeOrgContact({
      contactUrl: 'https://www.icao.int/Pages/contact.aspx',
    });
    assert.equal(result.contact, undefined);
    assert.ok(result.actions.includes('dropped-http-contactUrl'));
  });

  it('prefers explicit email over http contactUrl', () => {
    const result = normalizeOrgContact({
      email: 'hello@example.com',
      contactUrl: 'https://example.com/contact',
    });
    assert.equal(result.contact?.email, 'hello@example.com');
    assert.ok(result.actions.includes('dropped-http-contactUrl'));
  });

  it('preserves bookMeetingUrl', () => {
    const result = normalizeOrgContact({
      email: 'hello@example.com',
      bookMeetingUrl: 'https://example.com/meet',
    });
    assert.deepEqual(result.contact, {
      email: 'hello@example.com',
      bookMeetingUrl: 'https://example.com/meet',
    });
    assert.equal(result.changed, false);
  });
});

describe('migrateOrganizationCatalogDocument', () => {
  it('updates organization.contact and lastUpdated', () => {
    const { doc, changed } = migrateOrganizationCatalogDocument(
      {
        $schema: 'https://fides.community/schemas/organization-catalog/v1',
        organization: {
          id: 'org:sphereon',
          contact: { contactUrl: 'mailto:info@sphereon.com' },
        },
      },
      '2026-06-30T12:00:00.000Z',
    );
    assert.equal(changed, true);
    assert.deepEqual(doc.organization?.contact, { email: 'info@sphereon.com' });
    assert.equal(doc.lastUpdated, '2026-06-30T12:00:00.000Z');
  });
});
