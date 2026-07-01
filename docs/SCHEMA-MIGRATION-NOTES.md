# Schema migration notes (organization catalog)

Canonical migration log for **all FIDES catalogs** (shared intake + modal contracts):

**[fides-community-tools-tiles/docs/SCHEMA-MIGRATION-NOTES.md](https://github.com/FIDEScommunity/fides-community-tools-tiles/blob/main/docs/SCHEMA-MIGRATION-NOTES.md)**

Organization-specific pending work (2026-06): bulk migrate legacy `contact.email` / `contact.support`
in `community-catalogs/**` before live `wp-submissions-sync` validate step passes.

Script: `npm run migrate:org-contact -- --write` (`scripts/migrate-org-contact-v1-to-v2.ts`).
