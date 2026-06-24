import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildImportPlan,
  emptyState,
  hasQtspCertification,
  mergeQtspCertifications,
  normalizeDocument,
  type WpExportEntry,
} from '../scripts/import-wp-submissions.ts';

test('normalizeDocument sets organization.id from itemId', () => {
  const entry: WpExportEntry = {
    itemId: 'org:acme',
    slug: 'acme',
    filename: 'organization-catalog.json',
    source: 'wordpress',
    document: {
      organization: { name: 'Acme' },
    },
  };
  const doc = normalizeDocument(entry);
  assert.equal((doc.organization as Record<string, unknown>).id, 'org:acme');
});

test('buildImportPlan tracks writes and prunes removed WP slugs', () => {
  const state = emptyState('organization');
  state.managedSlugs = ['old-wp-org', 'still-here'];
  const entries: WpExportEntry[] = [
    {
      itemId: 'org:still-here',
      slug: 'still-here',
      filename: 'organization-catalog.json',
      source: 'wordpress',
      document: { organization: { id: 'org:still-here', name: 'Still' } },
    },
    {
      itemId: 'org:new-one',
      slug: 'new-one',
      filename: 'organization-catalog.json',
      source: 'wordpress',
      document: { organization: { id: 'org:new-one', name: 'New' } },
    },
  ];
  const plan = buildImportPlan(entries, state);
  assert.equal(plan.write.length, 2);
  assert.deepEqual(plan.prune, ['old-wp-org']);
});

test('mergeQtspCertifications preserves qtsp block from existing file', () => {
  const existing = {
    organization: {
      id: 'org:qtsp-example',
      name: 'QTSP Co',
      certifications: [{ code: 'qtsp', evidence: { kind: 'url', url: 'https://example.test' } }],
    },
  };
  const incoming = {
    organization: {
      id: 'org:qtsp-example',
      name: 'QTSP Co Updated',
      description: 'From WordPress',
    },
  };
  assert.ok(hasQtspCertification(existing));
  const merged = mergeQtspCertifications(incoming, existing);
  const org = merged.organization as Record<string, unknown>;
  assert.equal(org.name, 'QTSP Co Updated');
  assert.equal(org.description, 'From WordPress');
  assert.deepEqual(org.certifications, existing.organization.certifications);
});
