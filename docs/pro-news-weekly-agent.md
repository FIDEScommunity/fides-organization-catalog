# Weekly Pro listing news agent

Harvest recent headlines for **Official (Pro)** organization listings and write `data/pro-news.json`. Catalog plugins attach that file at runtime; do not put news in publisher `community-catalogs/` JSON.

## When

Weekly (Monday is fine). Do not run inside the daily catalog crawl.

## Scope

- Only orgs with `catalogTier: "Pro"` in `data/aggregated.json`.
- Skip orgs with `listingNewsEnabled: false` (Official listings that opted out in the WordPress form).
- Skip ids in `data/pro-news-sources.json` → `skipOrgIds` (test listings).
- Skip orgs without a reachable website.
- Max **5** items per org, last **90** days.
- Store **title, url, publishedAt, sourceLabel, sourceKind** only. No full text.
- Add `walletIds` (catalog wallet ids) **only** when the article is clearly about that wallet (wallet name in the title, that wallet’s GitHub repo, or its product page). Company, QTSP, ecosystem, or playground news stays org-only — omit `walletIds`. The wallet modal shows tagged items only.

## Sources (in order)

1. Known `indexUrl` / `rssUrl` / `githubReleases` from `data/pro-news-sources.json`.
2. Open each candidate URL. Keep it only if it returns 200 and the title matches the page. For JS-only indexes (Credenco `/news`), use the rendered page or `sitemap.xml` `/news/{slug}` URLs; the empty HTML shell is not the article list.
3. Optional web search `"OrgName"` + identity/wallet/eudi for the last 14 days, then the same URL check.
4. Do not use LinkedIn as the stored URL if a first-party page exists.
5. Do not treat git `-dev` / `fix(` prerelease tags as news.

## Output

Update `data/pro-news.json`:

- Keep items still within the 90-day window.
- Add new verified items; drop expired ones.
- Omit org keys that have zero items.
- Set `generatedAt` to now (UTC).

Then copy the same file to:

- `wordpress-plugin/fides-organization-catalog/data/pro-news.json`
- `../wallet-catalog/wordpress-plugin/fides-wallet-catalog/data/pro-news.json`

Open a PR. Do not merge yourself.

## Hard rules

- Never invent a headline or URL.
- Never crawl Community listings.
- Never harvest or keep items for orgs with `listingNewsEnabled: false`.
- English titles preferred; keep the original title if the source is not English.
- If nothing verifiable exists for an org, leave it out.
- Do not copy org headlines onto wallets. Untagged items are organization-only.
