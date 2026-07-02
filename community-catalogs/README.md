# Community Organization Catalogs

On-disk organization data for the FIDES Organization Catalog. Each folder contains an `organization-catalog.json`.

## How to add or update an organization

| Route | Best for |
|-------|----------|
| **WordPress forms** (recommended) | Most organizations on [fides.community](https://fides.community) — guided UI, moderation, automatic sync here |
| **GitHub Pull Request** | Power users, bulk edits, automation, or contributors without a FIDES account |

Both routes end up as files under `community-catalogs/<slug>/organization-catalog.json`. After publish or merge, CI validates and the crawler updates [`data/aggregated.json`](../data/aggregated.json).

### Via WordPress forms (recommended)

1. **Sign in** on fides.community and open the **submit** or **update** organization form.
2. Complete the form and submit — a maintainer reviews under **Tools → Catalog Submissions**.
3. After **Publish**, the [WP Submissions Sync](https://github.com/FIDEScommunity/fides-organization-catalog/actions/workflows/wp-submissions-sync.yml) workflow imports JSON into this folder and runs the crawler.

Logged-in users can also use **Suggest an update** (pencil icon) in an organization’s detail modal when the update form URL is configured.

Shortcodes (site operators): `[fides_organization_submit_form]`, `[fides_organization_update_form]`. Requires **fides-community-tools-tiles**.

**Pro listings:** organizations with a linked WordPress account export as **Pro** (`catalogTier`) with richer public fields (website, tags, offerings, media, contact URLs). See [docs/catalog-tier-go-live-checklist.md](../docs/catalog-tier-go-live-checklist.md).

**Docs:** [Catalog Submission Governance](https://github.com/FIDEScommunity/fides-community-tools-tiles/blob/main/docs/CATALOG-SUBMISSION-GOVERNANCE.md)

### Via Pull Request (alternative)

1. **Fork** this repository
2. Create `community-catalogs/<your-org>/organization-catalog.json` following the [schema](../schemas/organization-catalog.schema.json)
3. **Open a Pull Request** — CI runs `npm run validate`

The directory name must match the org code in `organization.id` (e.g. `org:your-org` → folder `your-org`).

## Minimal example

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

**Note:** verified **QTSP** (eIDAS Trust List) certifications are maintained by the `import-qtsp` pipeline — do not hand-edit those entries in PRs. Self-declared certifications (ISO 27001, SOC 2, DIACC, etc.) can be submitted via the WordPress form.

## Validation

**Pull requests:** validated automatically in CI.

**Locally:**

```bash
npm run validate
```

## Questions?

- Open an issue in this repository
- Email [catalog@fides.community](mailto:catalog@fides.community) if you cannot use the form
- [FIDES Community](https://fides.community)
