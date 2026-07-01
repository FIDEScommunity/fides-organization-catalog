#!/usr/bin/env tsx
/**
 * Bulk migrate legacy organization contact fields in community-catalogs.
 *
 * Usage:
 *   npx tsx scripts/migrate-org-contact-v1-to-v2.ts          # dry-run
 *   npx tsx scripts/migrate-org-contact-v1-to-v2.ts --write  # apply
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { migrateOrganizationCatalogDocument } from '../src/lib/migrate-org-contact-v1-to-v2.ts';

const ROOT = process.cwd();
const COMMUNITY_DIR = path.join(ROOT, 'community-catalogs');
const write = process.argv.includes('--write');

async function main() {
  const entries = await readdir(COMMUNITY_DIR, { withFileTypes: true });
  let migrated = 0;
  let skipped = 0;
  const mailtoFallbacks: string[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const filePath = path.join(COMMUNITY_DIR, entry.name, 'organization-catalog.json');
    try {
      const raw = await readFile(filePath, 'utf8');
      const doc = JSON.parse(raw) as Record<string, unknown>;
      const { doc: next, changed, actions } = migrateOrganizationCatalogDocument(doc);

      if (!changed) {
        skipped++;
        continue;
      }

      migrated++;
      const label = actions.includes('email→mailto:contactUrl') ? ' (mailto fallback)' : '';
      console.log(`${write ? '✏️ ' : '👀'} ${entry.name}: ${actions.join(', ')}${label}`);

      if (actions.includes('email→mailto:contactUrl')) {
        mailtoFallbacks.push(entry.name);
      }

      if (write) {
        await writeFile(filePath, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
      }
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') continue;
      throw err;
    }
  }

  console.log(
    `\n${write ? 'Migrated' : 'Would migrate'} ${migrated} catalog(s); ${skipped} unchanged.`,
  );

  if (mailtoFallbacks.length > 0) {
    console.log(
      `\nMailto fallback used for ${mailtoFallbacks.length} org(s) (email only, no support URL):`,
    );
    for (const slug of mailtoFallbacks) {
      console.log(`  - ${slug}`);
    }
  }

  if (!write && migrated > 0) {
    console.log('Re-run with --write to apply.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
