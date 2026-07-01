import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  migrateOrgContact,
  migrateOrganizationCatalogDocument,
} from './migrate-org-contact-v1-to-v2.ts';

describe('migrateOrgContact', () => {
  it('maps support URL to contactUrl', () => {
    const result = migrateOrgContact({
      support: 'https://www.icao.int/Pages/contact.aspx',
    });
    assert.equal(result.contact?.contactUrl, 'https://www.icao.int/Pages/contact.aspx');
    assert.deepEqual(result.actions, ['support→contactUrl']);
  });

  it('prefers support over email and drops email', () => {
    const result = migrateOrgContact({
      email: 'support-wallet@namirial.com',
      support: 'https://servicedesk.namirial.com/hc/en-gb',
    });
    assert.equal(result.contact?.contactUrl, 'https://servicedesk.namirial.com/hc/en-gb');
    assert.ok(result.actions.includes('support→contactUrl'));
    assert.ok(result.actions.includes('dropped-email'));
  });

  it('uses mailto when only email is present', () => {
    const result = migrateOrgContact({ email: 'support@igrant.io' });
    assert.equal(result.contact?.contactUrl, 'mailto:support@igrant.io');
    assert.ok(result.actions.includes('email→mailto:contactUrl'));
  });

  it('leaves an empty contact object unchanged', () => {
    const result = migrateOrgContact({});
    assert.equal(result.contact, undefined);
    assert.equal(result.changed, false);
    assert.deepEqual(result.actions, []);
  });

  it('preserves bookMeetingUrl', () => {
    const result = migrateOrgContact({
      contactUrl: 'https://example.com/contact',
      bookMeetingUrl: 'https://example.com/meet',
    });
    assert.deepEqual(result.contact, {
      contactUrl: 'https://example.com/contact',
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
          id: 'org:icao',
          contact: { support: 'https://www.icao.int/Pages/contact.aspx' },
        },
      },
      '2026-06-30T12:00:00.000Z',
    );
    assert.equal(changed, true);
    assert.deepEqual(doc.organization?.contact, {
      contactUrl: 'https://www.icao.int/Pages/contact.aspx',
    });
    assert.equal(doc.lastUpdated, '2026-06-30T12:00:00.000Z');
  });
});
