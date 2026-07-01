# FIDES Organization Catalog

Centralized overview of organizations in the FIDES ecosystem and their roles across wallets, issuers, credentials, and relying parties.

## Changelog

### 1.9.0

- Organization modal redesign: wallet-style hero with inline description; Pro-only media block (videos + images) in hero.
- Modal footer with Contact and Book a Meeting buttons (`contactUrl` / `bookMeetingUrl`) via shared `FidesCatalogUI`.
- WordPress submission form: contact URL fields, Pro media section, Offerings terminology, Certifications layout tweaks.
- Filter sidebar hides zero-count options unless currently selected.
- Schema, crawler, and public API updated for `media`, `ecosystemRoleCodes`, and contact v2.
- Deploy with fides-community-tools-tiles ≥ 1.8.2; sync `assets/lib/fides-catalog-ui.*` from tiles when releasing.
- Keep `fides_catalog_tier_ui_enabled` off until tier go-live (`docs/catalog-tier-go-live-checklist.md`).

### 1.8.1

- Honors master switch `fides_catalog_tier_ui_enabled` (Settings → FIDES Catalog SEO, default **off**). Until enabled: no Official badges/filter, website shown when present in JSON, legacy edit access for signed-in users.
- See `docs/catalog-tier-go-live-checklist.md` for go-live order.

### 1.8.0

- Mobile organization modal header: meta row (country · website) spans full width under action buttons; compact OFFICIAL badge; FIDES Supporter badge hidden on mobile.
- Website URL shown only for Pro/Official accounts (header and Organization details accordion); fixes non-Pro listings leaking website in details.
- Catalog tier / edit-access integration with fides-community-tools-tiles ≥ 1.7.8 (`Fides_Catalog_Org_Tier`, modal edit pencil gating).
- Asset enqueue versions aligned with plugin header via `FIDES_ORG_CATALOG_VERSION` (was stale `1.5.x` fallbacks).
- Deploy together with fides-community-tools-tiles ≥ 1.7.8; sync `assets/lib/fides-catalog-ui.*` from tiles when releasing.

### 1.5.0

- Certification filter is now two levels deep: under a parent certification (QTSP, DIACC) you can also filter on its sub-options — QTSP qualified trust services and DIACC PCTF components — with per-option result counts.
- Sub-options are collapsed by default behind a "Show N options" toggle and auto-expand when one is selected. Filter semantics: OR across families, and within a family the org must have the certification plus at least one selected sub-option (parent-only selects all).
- Readable labels for all QTSP trust service codes (no more raw `Q_*` codes) and long-label wrapping in the filter sidebar.

### 1.4.0

- Added a new `diacc` certification type (DIACC Certified under the Pan-Canadian Trust Framework). Modeled like QTSP: one "DIACC Certified" entry with certified PCTF components (`digital_wallet`, `verified_person`, `privacy`), each with optional Level of Assurance and its own proof link.
- Schema, TypeScript types, and crawler aggregation updated to carry `certifications[].details.components[]`.
- Catalog UI: DIACC badge on cards/list rows, and a certifications-accordion row where each component doubles as a proof button (shield icon + "Proof" + external-link).
- Linked DIACC certifications to Vaultie, FCT, Treefort, FraudFighter and Credivera.

### 1.3.8

- WordPress plugin version bump to `1.3.8`.
- KPI cards in the catalog UI now recalculate from the currently filtered/search result set.
- KPI values now update live during grid-only refreshes (search/filter), without introducing KPI quick-filter click behavior.

## The catalog is available as:

| Channel | URL |
|---------|-----|
| GitHub data | [`data/aggregated.json`](data/aggregated.json) |
| Public API | [See API docs](docs/API.md) |
| WordPress plugin | [`wordpress-plugin/`](wordpress-plugin/) |

## How it works

1. **Community catalogs** — contributors add an `organization-catalog.json` per organization in `community-catalogs/<org-slug>/`
2. **Crawler** — aggregates all sources, matches organizations against the wallet, issuer, credential, and RP catalogs, and writes `data/aggregated.json`
3. **WordPress plugin** — renders cards, filters, and a detail modal with the FIDES Ecosystem Explorer
4. **Serverless API** — query endpoint deployed on Vercel with OpenAPI and Swagger UI

## Add Your Organization

1. Fork this repository
2. Create `community-catalogs/<your-org>/organization-catalog.json` following the [schema](schemas/organization-catalog.schema.json):

```json
{
  "$schema": "https://fides.community/schemas/organization-catalog/v1",
  "organization": {
    "id": "org:your-org",
    "name": "Your Organization",
    "website": "https://example.com",
    "country": "NL"
  }
}
```

3. Submit a pull request — the **validate** workflow checks your JSON against the schema
4. After merge, the **crawl** workflow regenerates the aggregated data automatically

### CI: validate and crawl

- **Validate** — runs on push/PR when catalog or schema files change; checks JSON Schema + runs unit tests
- **Crawl** — runs on push to `main`, daily at 06:00 UTC, and via manual dispatch; regenerates `data/aggregated.json` and commits
- **Check links** — runs weekly (Monday 08:00 UTC); validates all website and logo URLs

## Seed from existing catalogs

To bootstrap `community-catalogs/` from existing FIDES catalogs (wallet, issuer, RP, credential):

```bash
npm run seed
```

This reads provider/organization data from sibling catalog repositories and generates one JSON file per unique organization. Existing files are not overwritten.

## Development

```bash
npm install
npm run validate    # Schema validation
npm test            # Unit tests
npm run crawl       # Regenerate aggregated data
npm run check-links # Validate URLs
npm run check:scaling # Payload growth gate check
```

### WordPress submissions (local)

After an admin **publishes** a submission on utrecht-demo:

```bash
npm run wp-sync:local
```

This imports published entries from `http://utrecht-demo.local`, validates schema, rebuilds `aggregated.json`, and syncs the plugin folder to Local.

Dry-run only:

```bash
FIDES_CATALOG_SECRET=$(php scripts/read-wp-catalog-secret.php) npm run import-wp-submissions
```

Production CI uses `.github/workflows/wp-submissions-sync.yml` (`WP_EXPORT_URL` + `WP_INVALIDATE_SECRET`).

**Canonical docs:** `fides-community-tools-tiles/docs/CATALOG-SUBMISSION-GOVERNANCE.md` — §14 (CI workflow + pitfalls), §15 (production deploy), §16 (new catalog checklist).

## Deployment

Before production go-live for **Community / Pro** tier labels (`catalogTier`), read the [catalog tier go-live checklist](docs/catalog-tier-go-live-checklist.md). Missing `catalogTier` in JSON defaults to **Pro** behaviour until orgs are re-exported from WordPress and crawled.

## Performance scaling gate

Before large catalog imports/releases, run:

```bash
npm run check:scaling
npm run check:scaling -- --target-count=400
```

This reports current and projected payload size (raw + gzip) and classifies status as green/orange/red with a recommended next step.

For the full release protocol and migration triggers (when to move to server-side paging/filtering), see [`docs/performance-scaling-test-protocol.md`](docs/performance-scaling-test-protocol.md).

## Public API (v2)

The API is deployed on Vercel at the project's Vercel URL.

- `GET /api/public/organization` — List/search/filter organizations
- `GET /api/public/api-docs` — OpenAPI 3.1 spec (JSON)
- `/swagger.html` — Interactive Swagger UI

See [docs/API.md](docs/API.md) for the full API contract and design choices.

## Schema

See [`schemas/organization-catalog.schema.json`](schemas/organization-catalog.schema.json).

The ID convention is `org:<code>` where `<code>` matches the directory name in `community-catalogs/` (lowercase, alphanumeric + hyphens).

## Phased development

- **Phase 1** (done): Standalone catalog that *reads* from other catalogs. Organization data used to be inline in wallet, issuer, RP, and credential catalogs.
- **Phase 2** (done): Wallet, issuer, RP, and credential community catalogs reference this catalog via **`orgId`**; inline `organization` / `provider` blocks are no longer used there. Crawlers resolve display fields (name, logo, contact, etc.) from `data/aggregated.json` here.
- **Phase 3** (done): WordPress submission export → `import-wp-submissions` → community-catalogs → crawl.

## License

Apache-2.0
