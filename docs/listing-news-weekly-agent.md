# Weekly listing news agent

Harvest recent first-party headlines for Official (Pro) organization listings
and explicitly allowlisted curated Community full-listing pilots. Write the
result to the legacy-compatible `data/pro-news.json` file; do not put news in
publisher `community-catalogs/` JSON.

## When

Run weekly (Monday is fine), outside the daily catalog crawl. Every run must
open a PR and receive manual review. Never merge the harvest automatically.

## Eligibility

An organization is eligible only when one of these rules matches:

1. `catalogTier: "Pro"` and `listingNewsEnabled` is not `false`; or
2. its source JSON has `catalogListingDepth: "full"` and its entry in
   `data/listing-news-sources.json` has
   `listingMode: "curated-full-pilot"`.

Community full listings are **not** eligible by default. The central source
allowlist is the opt-in for the curated pilot. A source or aggregated
`listingNewsEnabled: false` always wins and disables harvesting.

Always skip ids in `data/listing-news-sources.json` → `skipOrgIds`.

## Limits

### Official (Pro)

- Maximum 5 items per organization.
- Maximum age 90 days.
- Known source URLs are preferred, but a verified relevant third-party article
  may be retained when it follows the existing Pro policy.

### Curated full-listing pilot

- Maximum 3 items per organization.
- Maximum age 60 days.
- First-party sources only.
- The article host and path must match `allowedHosts` and
  `allowedPathPrefixes`.
- Use only dedicated programme/product news sources. Never crawl a general
  ministry, municipality, country, university, police, or agency news stream.
- Every article must be reviewed before it enters the PR.

The initial pilot consists of:

- `org:webuild`: dedicated WE BUILD consortium news.
- `org:germany`: dedicated German EUDI Wallet news.
- `org:imda`: dedicated TradeTrust news, never general IMDA news.

## Source procedure

Use sources in this order:

1. `indexUrl`, `rssUrl`, and `githubReleases` from
   `data/listing-news-sources.json`.
2. Open every candidate URL. Keep it only if it returns 200, has a stable
   article URL, shows the claimed title, and provides a verifiable publication
   date.
3. For Pro listings only, optional web search may discover another source.
   Apply the same URL, title, and date checks.
4. Do not use LinkedIn as the stored URL when a first-party page exists.
5. Do not treat git `-dev` or `fix(` prerelease tags as news.

For pilot sources, reject index pages, redirects outside the allowlist,
generic government news, politics, procurement, vacancies, and personnel
announcements.

## Output

Update `data/pro-news.json`:

- Keep items still inside the applicable 90- or 60-day window.
- Add new verified items and drop expired items.
- Omit organization keys that have zero items.
- Store only `title`, `url`, `publishedAt`, `sourceLabel`, `sourceKind`, and
  optional `walletIds`.
- Add `walletIds` only when an article is clearly about that wallet. General
  organization, ecosystem, QTSP, programme, or playground news remains
  organization-only.
- Set `generatedAt` to the current UTC time.

Then copy the exact same file to:

- `wordpress-plugin/fides-organization-catalog/data/pro-news.json`
- `../wallet-catalog/wordpress-plugin/fides-wallet-catalog/data/pro-news.json`

The `pro-news.json` filename is retained for plugin compatibility even though
the feed now also contains explicitly allowlisted pilot listings.

## Validation

Run:

```bash
npm run validate:news
npm test
```

The news validator enforces pilot eligibility, full-listing status, opt-outs,
item limits, age windows, first-party hosts, path prefixes, duplicate URLs, and
basic output structure. Network availability and article-title correctness
remain manual review responsibilities.

## Hard rules

- Never invent a headline, publication date, or URL.
- Never treat all Community or full listings as eligible.
- Never broaden a pilot source beyond its configured host and path.
- Never harvest or retain items for an organization with
  `listingNewsEnabled: false`.
- Prefer English titles; otherwise retain the original title.
- If no verifiable item exists, leave the organization out.
- Open a PR and require human review; do not merge the harvest yourself.
