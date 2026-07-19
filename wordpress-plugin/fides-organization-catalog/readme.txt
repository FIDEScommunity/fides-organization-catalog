=== FIDES Organization Catalog ===
Contributors: fidescommunity
Requires at least: 5.0
Tested up to: 6.7
Stable tag: 1.10.12
License: Apache-2.0
License URI: https://www.apache.org/licenses/LICENSE-2.0

Interactive organization catalog with filters, ecosystem explorer, and SSR/SEO when fides-community-tools-tiles is active.

== Description ==

Displays the FIDES Organization Catalog — organizations in the global digital identity and verifiable credentials ecosystem.

Organizations add and update their listing on fides.community via WordPress submission forms (recommended), or contribute JSON via GitHub Pull Requests. Published data syncs to the community catalog repository.

**Submission forms (logged-in users, requires fides-community-tools-tiles):**

* `[fides_organization_submit_form]` — add a new organization (moderated before publish)
* `[fides_organization_update_form]` — suggest changes (`?org=` pre-selects from modal pencil)

Configure the update form page URL under **Settings → FIDES Organization Catalog**.

**Catalog shortcode:** `[fides_organization_catalog]`

== Changelog ==

= 1.10.12 =
* Ecosystem roles: add Trust Infrastructure Provider (`trust_infrastructure_provider`).

= 1.10.11 =
* Mobile KPI cards: keep 2×2 grid with inline value + label (aligned with wallet catalog); remove narrow-screen single-column override.

= 1.10.10 =
* Organization form: keep Pro plan badge static when tier is Pro; refresh plan tier on form reset.
* Pro organization updates: allow linked owner or site administrator to suggest updates (copy + form behaviour).

= 1.10.9 =
* Organization detail modal: restore subtle Last updated footer above the contact footer; dates use the browser locale (bundled fides-catalog-ui from tiles ≥ 1.8.20).

= 1.10.8 =
* Card and modal country row: globe icon size and spacing match use-case catalog (15px, 0.375rem gap).

= 1.10.7 =
* Grid card header: globe icon + country name instead of flag (use-case catalog style). Synced fides-catalog-ui from tiles ≥ 1.8.18.

= 1.10.6 =
* Pro listing edit: pencil/update form only for linked owner or WP admin (catalogTier Pro). Synced modal library edit-access checks.

= 1.10.5 =
* Fix Pro plan field badges on Community listings (linked badge again). Requires tiles ≥ 1.8.7 for form tier from published catalogTier.

= 1.10.4 =
* Submission form: static Pro plan field badges for linked Pro accounts on submit/update forms (requires tiles ≥ 1.8.6 for `userOwnsProOrg`).

= 1.10.3 =
* Submission form: show Pro plan badge on Pro-only field labels for Pro accounts too (static badge, no plans link).

= 1.10.2 =
* Fix organization catalog render crash (infinite recursion in orgCatalogTierIsPro vs orgCatalogTierIsCommunity when catalogTier is set).

= 1.10.1 =
* Hide Contact footer on Community org modals when tier UI is on (align with wallet modal and listing badge).
* Requires fides-community-tools-tiles ≥ 1.8.5 (sync `assets/lib/fides-catalog-ui.*` from tiles when releasing).

= 1.10.0 =
* Contact: `contact.email` replaces `contactUrl`; modal Contact button opens mailto (shared FidesCatalogUI).
* Submission form: public Contact email field (separate from submitter review email).
* Ecosystem roles: EUDI Wallet Intermediary, eIDAS Trust Service Provider.
* Requires fides-community-tools-tiles ≥ 1.8.4 (sync `assets/lib/fides-catalog-ui.*` from tiles when releasing).

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
