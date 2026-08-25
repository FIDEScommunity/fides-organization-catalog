=== FIDES Organization Catalog ===
Contributors: fidescommunity
Requires at least: 5.0
Tested up to: 6.7
Stable tag: 1.14.36
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

**Homepage showcase shortcode:** `[fides_organization_showcase]`

Renders a server-side carousel of organizations connected to documented use
cases. Supports `cards`, `catalog_url`, and `show_profile_cta` attributes.

== Changelog ==

= 1.14.36 =
* Sync shared modal UI: Use cases accordion scrolls horizontally when more than two cases are linked (tiles ≥ 1.13.17).

= 1.14.35 =
* Sync shared modal UI: Use cases accordion uses a two-column layout on narrow screens; a single linked case spans the full row (tiles ≥ 1.13.15).

= 1.14.34 =
* Ensure signed-out, unavailable, and linked-owner-only submission notices load the organization form styles and remain readable on light backgrounds.

= 1.14.33 =
* Add an Official listing claim request to the organization update form, using the submitter's organization email address for follow-up.
* Keep claim requests in WordPress review metadata only; they are excluded from catalog diffs and GitHub exports (requires tiles ≥ 1.13.11 for admin handling and claim-only publication protection).

= 1.14.32 =
* Full Community organizations now expose website, tags, offerings, media and contact details in the modal while retaining the Community badge.
* SSR website and offerings visibility now follows full listing depth instead of Official status.

= 1.14.31 =
* Full Community listings unlock all organization form fields without showing an Official badge (requires tiles ≥ 1.13.7).

= 1.14.30 =
* Use-case cards include Matomo Use Case Click ({orgId}|{useCaseId}).

= 1.14.29 =
* Use-case cards use the shared modal UI helper/CSS (still open by default).

= 1.14.28 =
* Matomo funnel: Official Listing CTA Event Name is org_id|plans|listing_type;
  Modal Open includes from:usecase:{id} when opened via use-case attribution.

= 1.14.27 =
* Clarify the Community modal profile CTA: keep “Is this your organisation?”,
  sharpen the supporting copy, and link to “Manage your Official Listing”.

= 1.14.26 =
* Do not stretch a single use-case card across the full modal width.

= 1.14.25 =
* Wire Matomo click tracking for Organization Showcase (cards, view all, find CTA).

= 1.14.24 =
* Use-case scroll arrows: filled blue when active for clearer affordance.

= 1.14.23 =
* Softer use-case card/nav hover (no clipped focus ring in the scroll row).

= 1.14.22 =
* Use-case scroll arrows sit left/right of the cards (no extra bottom row).

= 1.14.21 =
* Use-case cards: clearer scroll affordance (larger peek, “More use cases”, nav arrows).

= 1.14.20 =
* Use-case cards: peek + fade when more than 3 so horizontal scroll is obvious.

= 1.14.19 =
* Organisation modal: Use cases as similar-style cards; horizontal scroll when more than 3.

= 1.14.18 =
* Organisation modal: open the Use cases accordion by default when linked use cases exist.

= 1.14.17 =
* Official badge requires explicit `catalogTier: Pro`. Curated Community
  listings can keep full fields via `catalogListingDepth: full` (tiles ≥ 1.10.0).

= 1.14.16 =
* After sign-in, Back from the logged-in page reloads a stale guest catalog
  snapshot so the like star sees the session (needs tiles ≥ 1.9.23).

= 1.14.15 =
* Sync shared catalog UI: after magic-link sign-in, Back reloads a cached
  logged-out page so the like star sees the new session.

= 1.14.14 =
* Organization modal website and contact links send provider slugs in Matomo
  Event Name (`credenco|website|www.credenco.com`).

= 1.14.13 =
* Switch only the Active users KPI to its compact label before the full text
  starts wrapping, while retaining the longer organization and official labels.

= 1.14.12 =
* Use consistent sentence-case capitalization for compact showcase KPI labels.

= 1.14.11 =
* Always spell out Organisations in the showcase KPI bar and stack KPI labels
  below their counts on very narrow phones.

= 1.14.10 =
* Balance the compact mobile KPI row and present the organization link as a
  tighter, visually separated footer.

= 1.14.9 =
* Hide the full Active users label reliably on phones and prevent the compact
  KPI row from overflowing narrow mobile viewports.

= 1.14.8 =
* Give Active users room to wrap in the showcase toolbar and keep the Explore
  link from crowding the KPI row on mid-width layouts.

= 1.14.7 =
* Keep full KPI labels (Organisations, Official Listings, Active users…) until
  phone widths; only use short labels below 560px.

= 1.14.6 =
* Store organization submission descriptions as plain text so ampersands are
  not double-escaped as &amp; in the catalog modal.

= 1.14.5 =
* Capitalize Organisations, keep “in the FIDES Explorer” only on Active users,
  and switch to compact KPI labels earlier for responsive layouts.

= 1.14.4 =
* Show “organisations in the FIDES Explorer”, add an active-users counter from
  WordPress accounts, and keep the three KPIs compact on mobile.

= 1.14.3 =
* After GitHub fails, use a 12-hour browser cache and the WP last-known-good aggregated feed before the bundled plugin snapshot.

= 1.14.2 =
* Show a dismissible notice when GitHub catalog data is unreachable and the plugin snapshot is used.

= 1.14.1 =
* Improve mobile showcase readability with larger organization names,
  metadata, role chips, controls, and profile CTA text. Desktop styling is unchanged.

= 1.14.0 =
* Add an “or Ask FIDES” button beside organization search when FIDES Assistant
  0.6.1 or newer is active.
* Reuse the headless assistant modal, prefill the current search without
  submitting it, and show an organization-specific chat placeholder.

= 1.13.2 =
* Clarify the homepage showcase CTA copy, say “mapped in the FIDES Explorer”,
  and keep mobile KPIs on one compact line.

= 1.13.1 =
* Exclude FIDES Labs from the rotating homepage organization showcase while
  retaining it in the full catalog and catalog statistics.

= 1.13.0 =
* Add a WordPress setting to show or hide the “Is this your organisation?”
  action at the bottom of Community organization modals.
* Take ownership of `[fides_organization_showcase]`, including its server-side
  data loading, daily rotation, responsive styling and carousel behavior.

= 1.12.3 =
* Present the Pro Plan action as a quiet text link instead of a prominent
  full-width modal button.

= 1.12.2 =
* Refer to the paid offering as a “Pro Plan” in the Community modal action.

= 1.12.1 =
* Rename the Community modal action to “Manage your profile with FIDES Pro” so
  it describes the service without implying FIDES endorsement or verification.
* Keep the internal Plans journey in the current browser window.

= 1.12.0 =
* Add a contextual “Get an official profile” action to Community organization
  modals. The action passes organization context to the FIDES Plans page
  without presenting the existing update form as a claim workflow.

= 1.11.3 =
* Mobile filters: keep the drawer open when expanding groups or selecting options; keep body scroll lock in sync (shared FidesCatalogUI.createMobileFiltersController from tiles ≥ 1.8.28).

= 1.11.2 =
* Ecosystem roles: add Interop Testbed Operator (`interop_testbed_operator`).

= 1.11.1 =
* List view: show country flag instead of globe icon (tooltip still shows country name).

= 1.11.0 =
* Organization detail modal: add a Use cases accordion (directly below About) listing the use cases the organization is involved in, derived at runtime from the use case catalog via `links.organizations[].refId`.
* Use case rows show inline like (★) counts using the shared ratings API, matching the ecosystem role accordions (requires the `usecase` rateable type from fides-use-case-catalog).
* Settings: add "Use case catalog page URL" (option `fides_org_catalog_use_case_catalog_url`, shortcode attribute `use_case_catalog_url`) used for the ?usecase=… links in the Use cases accordion.

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
