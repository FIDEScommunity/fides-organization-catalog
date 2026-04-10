# FIDES Organization Catalog

Centralized overview of organizations in the FIDES ecosystem and their roles across wallets, issuers, credentials, and relying parties.

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
```

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

## License

Apache-2.0
