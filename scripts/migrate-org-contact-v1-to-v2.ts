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
import { migrateOrganizationCatalogDocument } from '../src/lib/normalize-org-contact.ts';

const ROOT = process.cwd();
const COMMUNITY_DIR = path.join(ROOT, 'community-catalogs');
const write = process.argv.includes('--write');

async function main() {
  const entries = await readdir(COMMUNITY_DIR, { withFileTypes: true });
  let migrated = 0;
  let skipped = 0;
  const emailMigrations: string[] = [];
  const droppedHttp: string[] = [];

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
      console.log(`${write ? '✏️ ' : '👀'} ${entry.name}: ${actions.join(', ')}`);

      if (actions.includes('contactUrl→email') || actions.includes('support→email')) {
        emailMigrations.push(entry.name);
      }
      if (actions.includes('dropped-http-contactUrl')) {
        droppedHttp.push(entry.name);
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

  if (emailMigrations.length > 0) {
    console.log(`\nMigrated to contact.email for ${emailMigrations.length} org(s).`);
  }
  if (droppedHttp.length > 0) {
    console.log(
      `\nDropped http(s) contactUrl with no email for ${droppedHttp.length} org(s) — update via the org form:`,
    );
    for (const slug of droppedHttp) {
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
