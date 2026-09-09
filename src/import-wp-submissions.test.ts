import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  buildImportPlan,
  emptyState,
  forceHttpExport,
  hasPreservedCertification,
  hasQtspCertification,
  loadCommittedExportPayload,
  mergePreservedCertifications,
  mergeQtspCertifications,
  normalizeDocument,
  preserveMissingWpEntries,
  type WpExportEntry,
} from '../scripts/import-wp-submissions.ts';

test('forceHttpExport enables explicit local HTTP sync', () => {
  assert.equal(forceHttpExport({ FIDES_WP_EXPORT_FORCE_HTTP: '1' }), true);
  assert.equal(forceHttpExport({ FIDES_WP_EXPORT_FORCE_HTTP: 'true' }), true);
  assert.equal(forceHttpExport({ FIDES_WP_EXPORT_FORCE_HTTP: 'yes' }), true);
  assert.equal(forceHttpExport({ FIDES_WP_EXPORT_FORCE_HTTP: '0' }), false);
  assert.equal(forceHttpExport({}), false);
});

test('preserveMissingWpEntries enables non-destructive local overlays', () => {
  assert.equal(preserveMissingWpEntries({ FIDES_WP_EXPORT_PRESERVE_MISSING: '1' }), true);
  assert.equal(preserveMissingWpEntries({ FIDES_WP_EXPORT_PRESERVE_MISSING: 'true' }), true);
  assert.equal(preserveMissingWpEntries({ FIDES_WP_EXPORT_PRESERVE_MISSING: '0' }), false);
  assert.equal(preserveMissingWpEntries({}), false);
});

test('loadCommittedExportPayload returns null when the file is absent', async () => {
  const missing = path.join(os.tmpdir(), `fides-missing-${Date.now()}.json`);
  assert.equal(await loadCommittedExportPayload(missing), null);
});

test('loadCommittedExportPayload parses a committed export file', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'fides-export-'));
  const file = path.join(dir, 'organization.json');
  const payload = {
    schemaVersion: '1.0.0',
    catalogType: 'organization',
    generatedAt: new Date().toISOString(),
    entries: [
      {
        itemId: 'org:acme',
        slug: 'acme',
        filename: 'organization-catalog.json',
        source: 'wordpress',
        document: { organization: { id: 'org:acme', name: 'Acme' } },
      },
    ],
  };
  await fs.writeFile(file, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  const loaded = await loadCommittedExportPayload(file);
  assert.equal(loaded?.entries.length, 1);
  assert.equal(loaded?.entries[0].slug, 'acme');
  await fs.rm(dir, { recursive: true, force: true });
});

test('loadCommittedExportPayload throws a clear error on malformed JSON', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'fides-export-bad-'));
  const file = path.join(dir, 'organization.json');
  await fs.writeFile(file, '{ not json', 'utf8');
  await assert.rejects(loadCommittedExportPayload(file), /Invalid committed export/);
  await fs.rm(dir, { recursive: true, force: true });
});

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

test('mergePreservedCertifications keeps UIDAI OVSE and WordPress self-declared certs', () => {
  const existing = {
    organization: {
      id: 'org:ayanworks',
      name: 'AyanWorks',
      certifications: [
        { code: 'uidai_ovse', evidence: { kind: 'url', url: 'https://uidai.gov.in/en/ovse' } },
        { code: 'qtsp', evidence: { kind: 'url', url: 'https://example.test/qtsp' } },
      ],
    },
  };
  const incoming = {
    organization: {
      id: 'org:ayanworks',
      name: 'AyanWorks',
      certifications: [{ code: 'iso27001' }],
    },
  };
  assert.ok(hasPreservedCertification(existing));
  const merged = mergePreservedCertifications(incoming, existing);
  const org = merged.organization as Record<string, unknown>;
  const codes = (org.certifications as Array<{ code: string }>).map((c) => c.code);
  assert.deepEqual(codes, ['uidai_ovse', 'qtsp', 'iso27001']);
});
