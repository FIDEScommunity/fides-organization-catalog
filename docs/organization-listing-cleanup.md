# Organization listing cleanup

Playbook for bulk or editorial cleanup of organization listings (names, descriptions,
websites, roles, duplicates, Community/Pro). Cursor rule:
`.cursor/rules/organization-listing-cleanup.mdc`.

Live catalog: https://fides.community/organizations/

## 1. Split the work by source of truth

| Kind | How to recognise | Where to persist |
|------|------------------|------------------|
| **WordPress-managed** | Slug in `data/wp-submission-state.json` → `managedSlugs`, or `community-catalogs/<slug>/.wordpress-source` | WordPress **update form**, then publish. GitHub is overwritten on the next WP sync. |
| **GitHub-only** | Not in that list | `community-catalogs/<slug>/organization-catalog.json` |

WP import (`scripts/import-wp-submissions.ts`) replaces the GitHub file wholesale.
The merge exception is importer-owned **QTSP** and **UIDAI OVSE** `certifications`.

Seeing the new text **live after a GitHub push does not mean WordPress is updated**.
Give the user a copy-paste list for remaining WP diffs and wait until they publish.

## 2. Never bump timestamps

Cleanup must not change “Last updated” in the catalog.

- Do **not** edit `lastUpdated` in source JSON.
- Crawler: `updatedAt = catalog.lastUpdated || gitDate || now`.
- If a source file has **no** `lastUpdated`, copy that org’s current
  `updatedAt` from `data/aggregated.json` into `lastUpdated` **before** crawl,
  so the crawler does not fall through to git date or `now`.
- `scripts/import-qtsp-from-efda.mjs` and `scripts/import-ovse-from-uidai.mjs`: on existing-org updates, do **not** set
  `lastUpdated = now`. Cert sync must not look like an editorial update.

After crawl, confirm existing orgs did not get a new `updatedAt`.

## 3. Community vs Pro

Live **listing badge**:

- **Official** = explicit `catalogTier: "Pro"` **or** the org id is in `proOrgIds`
  (linked WordPress account).
- **Community Listing** = explicit `Community`, or **missing** `catalogTier` and
  not in `proOrgIds`.

`catalogTier: "Community"` belongs only on **GitHub-only** records that had no tier.
Do **not** add it on WP-managed orgs; export sets it from ownership
(`Fides_Catalog_Org_Tier::filter_org_export`).

Community export (when the tier UI switch is on) strips from the public payload:

- `website`, `tags`, `offerings`, `contact`, `media`, `recognitions`
- description truncated to **200** characters

Filling `website` in a Community WP form stores it in WordPress but **does not**
survive GitHub export. The live website on a Community org will disappear on the
next WP sync unless the org is Pro.

## 4. QTSP / eIDAS evidence

Never remove or rewrite Trust Browser links:

`https://eidas.ec.europa.eu/efda/trust-services/browse/eidas/tls/tl/{CC}/tsp/{n}`

If you delete a duplicate QTSP record, **merge those evidence URLs** onto the
surviving org (so the weekly importer still matches). Keep ceased QTSPs as
records with evidence; do not delete them only because the old website is dead.

## 5. Typical GitHub-only edits

- Rewrite junk or placeholder descriptions (English).
- Generic QTSP line when there is no better text:
  `{name} is a Qualified Trust Service Provider on the EU eIDAS Trust List for {country}.`
- Trailing commas / overly long display `name`: shorten `name`, keep long `legalName`.
- Dead websites: remove the field; do not invent a replacement.
- Duplicates: delete the extra GitHub folder after merging evidence.

Do not mix in unrelated WIP (new orgs, crawler features, `fides-catalog-ui`).

## 6. Crawl, commit, push

1. `npm run validate`
2. If the working tree has **uncommitted crawler / type / UI** changes, stash them.
   Crawl with the **committed** crawler so `aggregated.json` does not grow WIP fields
   (`trustSchemes`, extra role codes, untracked new orgs).
3. Park or exclude untracked new `community-catalogs/` folders so they are not
   written into `aggregated.json`.
4. `npm run crawl` — then `npm run sync-local` (or the utrecht-demo rsync).
5. Commit **only**:
   - `community-catalogs/` (tracked updates and deletes)
   - `data/aggregated.json`
   - `wordpress-plugin/fides-organization-catalog/data/aggregated.json`
   - `data/org-history-state.json` if the crawl touched it
   - `scripts/import-qtsp-from-efda.mjs` if the lastUpdated fix is part of the change
6. Fast-forward `main` if origin moved (CI often commits `aggregated.json`), then push.

## 7. WordPress follow-up

After GitHub is on `main`, diff `data/wp-export/organization.json` against
`community-catalogs/<slug>/` for every managed slug you touched.

For each remaining diff, give the user **exact WP form fields** (name, description,
website, roles). They publish in WordPress; the next WP sync then keeps GitHub
aligned instead of reverting.

Skip logo changes until a stable public URL exists.
