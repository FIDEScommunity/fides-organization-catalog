=== FIDES Organization Catalog ===
Contributors: fidescommunity
Requires at least: 5.0
Tested up to: 6.7
Stable tag: 1.9.0
License: Apache-2.0
License URI: https://www.apache.org/licenses/LICENSE-2.0

Interactive organization catalog with filters, ecosystem explorer, and SSR/SEO when fides-community-tools-tiles is active.

== Changelog ==

= 1.9.0 =
* Organization modal: wallet-style hero with description; Pro-only media gallery (YouTube/Vimeo + images).
* Modal footer Contact and Book a Meeting buttons via `contact.contactUrl` and `contact.bookMeetingUrl` (shared FidesCatalogUI).
* Submission form: contact URLs, Pro media uploads, Offerings label (was Services), Certifications section layout.
* Filter sidebar hides options with zero results (selected options stay visible).
* Schema: `media`, `ecosystemRoleCodes`, contact v2 fields; crawler and API pass-through updated.
* Requires fides-community-tools-tiles ≥ 1.8.2 (sync `assets/lib/fides-catalog-ui.*` from tiles when releasing).

= 1.8.1 =
* Respects master switch `fides_catalog_tier_ui_enabled` from fides-community-tools-tiles (default off): tier UI hidden until go-live.
* Passes `tierUiEnabled` to catalog JS; website and Official treatment follow switch.

= 1.8.0 =
* Mobile modal header layout, Pro-only website visibility, catalog tier edit access — see repository README.md §1.8.0.
* Requires fides-community-tools-tiles ≥ 1.7.8 for org tier helpers and shared modal CSS baseline.
