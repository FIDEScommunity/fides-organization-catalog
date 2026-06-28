# catalogTier — go-live checklist

Internal reminder for rolling out **Community / Pro** tier labels and tier-gated public fields.

## Master switch (deploy first)

**Settings → FIDES Catalog SEO → “Enable Community vs Pro tier differences”** (`fides_catalog_tier_ui_enabled`).

| Switch | Behaviour |
|--------|-------------|
| **Off (default)** | Legacy public catalog: no Official badges/filters, pro fields stay visible when present in JSON, export adapters skip tier filtering, any signed-in user can suggest updates. Safe to deploy tier code before go-live. |
| **On** | Tier UI, export filtering, submission constraints, and Pro-only edit rules become active. |

Programmatic override: `fides_catalog_tier_ui_force_enable` filter (same pattern as SSR).

## Default when `catalogTier` is missing

**Not Community — treated as Pro.**

Missing `catalogTier` in `community-catalogs/…/organization-catalog.json` or `aggregated.json` means:

- Explorer modal and SSR behave as **Pro** (website, tags, offerings, contact stay visible if present in JSON).
- PHP: `Fides_Catalog_Org_Tier::item_is_community()` returns `false` when the field is absent.
- JS: `resolveCatalogTier()` returns `Pro` when the field is absent.

This is intentional for backwards compatibility with legacy Git JSON. It does **not** mean “free tier until proven otherwise”.

Only explicit values count:

| `catalogTier` in JSON | Public behaviour |
|----------------------|------------------|
| `"Community"` | Pro-only fields hidden; description capped at export |
| `"Pro"` | Full public payload |
| *(absent)* | **Same as Pro** (legacy) |

Legacy slug `gratis` in old JSON is still accepted when reading and maps to Community.

## Where the field lives

`catalogTier` is **not** stored in the WordPress submission payload. It is computed at **export** from ownership (`fides_catalog_ownership`: linked WP user ⇒ Pro, else Community).

It must appear in:

1. **Per-org source:** `community-catalogs/<slug>/organization-catalog.json` → `organization.catalogTier`
2. **Aggregated:** `data/aggregated.json` and `wordpress-plugin/fides-organization-catalog/data/aggregated.json` (crawler copies it from (1); it does not compute tier itself)

Wallets inherit tier via `orgId` in `filter_wallet_export()`.

Schema: `schemas/organization-catalog.schema.json` (`enum`: `Community`, `Pro`).

## Before production go-live

- [ ] Deploy tiles + catalog plugins with `Fides_Catalog_Org_Tier` and UI that understand `Community` / `Pro`.
- [ ] **Re-export** all organization (and wallet) submissions from WordPress so every managed org JSON gets `catalogTier` and Community orgs get pro fields stripped at export.
  - Local: `npm run wp-sync:local` (after utrecht-demo is up to date).
  - Production: publish/sync workflow that writes `community-catalogs/` (GitHub Actions or manual export).
- [ ] Run **`npm run validate`** — must pass (schema allows `catalogTier`).
- [ ] Run **`npm run crawl`** — refreshes `aggregated.json` from community-catalog sources.
- [ ] Deploy updated plugin **`data/aggregated.json`** to production WordPress.
- [ ] Spot-check: Community org → no website/tags/offerings in modal; Pro org → fields visible; JSON contains `"catalogTier": "Community"` or `"Pro"`.
- [ ] Review Community org descriptions longer than 200 characters (export truncates; may need submitter follow-up).

## After go-live (ongoing)

- Every **new publish** from WP should already set `catalogTier` via `filter_org_export()`.
- CI crawl on `main` keeps `aggregated.json` in sync when community-catalog JSON changes.
- Orgs never re-exported after tier rollout will keep **Pro fallback behaviour** until their JSON is regenerated.

## Related code

| Area | Location |
|------|----------|
| Tier logic + export filter | `fides-community-tools-tiles/includes/class-fides-catalog-org-tier.php` |
| Org export hook | `organization-catalog/…/class-fides-organization-catalog-submission-adapter.php` → `payload_to_export()` |
| Crawler pass-through | `organization-catalog/src/crawler/index.ts` |
| Governance (broader) | `fides-community-tools-tiles/docs/CATALOG-SUBMISSION-GOVERNANCE.md` |

## Risk if skipped

Community organizations with stale Git JSON (no `catalogTier`, pro fields still in file) may **show Pro-only content publicly** until re-exported — opposite of the intended Community experience.
