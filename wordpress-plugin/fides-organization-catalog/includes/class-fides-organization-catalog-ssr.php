<?php
/**
 * Organization Catalog SSR — organization-specific subclass of the shared
 * Fides_Catalog_SSR_Renderer base class shipped by fides-community-tools-tiles.
 *
 * Catalog-specific responsibilities living here:
 *   - Register the 'organization' catalog type in Fides_Catalog_Registry,
 *     with the field-name overrides for the organization aggregated.json
 *     shape (`logoUri`, plus the standard `name` / `description`).
 *   - Override the listing page URL so CollectionPage JSON-LD points to the
 *     correct canonical URL.
 *   - Build dl meta rows + chip sections for the SSR detail block (sectors,
 *     country, ecosystem roles, website).
 *   - Enrich the Organization JSON-LD with country / sectors / website etc.
 *
 * Backwards compat: when the shared base class isn't loaded (e.g. tiles
 * plugin disabled), this class is a no-op shim.
 *
 * @package fides-organization-catalog
 */

if (! defined('ABSPATH')) {
    exit;
}

if (! class_exists('Fides_Organization_Catalog_SSR')) {

    if (! class_exists('Fides_Catalog_SSR_Renderer')) {

        class Fides_Organization_Catalog_SSR {
            const TYPE                  = 'organization';
            const DEFAULT_CATALOG_PATH  = '/organizations/';
            const LEGACY_CATALOG_PATH   = '/ecosystem-explorer/organization-catalog/';
            const OPTION_CATALOG_URL    = 'fides_org_catalog_page_url';
            const OPTION_MIGRATED_VER   = 'fides_org_catalog_path_migrated_to';
            const MAX_LISTING_ITEMS     = 30;
            public static function bootstrap() { /* no-op without base */ }
            public static function build_initial_html(array $atts) { return ''; }
        }

    } else {

        class Fides_Organization_Catalog_SSR extends Fides_Catalog_SSR_Renderer {

            const TYPE                  = 'organization';
            const DEFAULT_CATALOG_PATH  = '/organizations/';
            const LEGACY_CATALOG_PATH   = '/ecosystem-explorer/organization-catalog/';
            const OPTION_CATALOG_URL    = 'fides_org_catalog_page_url';
            const OPTION_MIGRATED_VER   = 'fides_org_catalog_path_migrated_to';
            const MAX_LISTING_ITEMS     = 30;

            /** @var self|null */
            private static $instance = null;

            public static function bootstrap(): void {
                if (self::$instance === null) {
                    self::migrate_catalog_path_option();
                    self::$instance = new self();
                    self::$instance->bootstrap_renderer();
                    add_action('admin_init', array(__CLASS__, 'register_settings'));
                }
            }

            /**
             * One-shot path migration introduced in 1.3.1.
             *
             * Older versions defaulted to /ecosystem-explorer/organization-catalog/.
             * The canonical path is now /organizations/. If the option is empty
             * (using the old default) or still pointing at the legacy path, we
             * blank it out so the new DEFAULT_CATALOG_PATH takes over without
             * needing WP-CLI access. Also clears any cached aggregated transient
             * so the listing JSON-LD / sitemap pick up the new path immediately.
             *
             * Idempotent: tracked via a flag option so it only runs once per
             * release.
             */
            private static function migrate_catalog_path_option(): void {
                $migrated = (string) get_option(self::OPTION_MIGRATED_VER, '');
                if ($migrated === '1.3.1') {
                    return;
                }
                $current = (string) get_option(self::OPTION_CATALOG_URL, '');
                if ($current === '' || $current === self::LEGACY_CATALOG_PATH) {
                    delete_option(self::OPTION_CATALOG_URL);
                    // Source cache key matches Fides_Catalog_Source::transient_key() in tiles.
                    delete_transient('fides_catalog_src_' . self::TYPE . '_v1');
                }
                update_option(self::OPTION_MIGRATED_VER, '1.3.1', false);
            }

            public static function build_initial_html(array $atts): string {
                self::bootstrap();
                return self::$instance->render_initial_html($atts);
            }

            /* --------------------------------------------------------------
             * Required overrides
             * -------------------------------------------------------------- */

            protected function type(): string             { return self::TYPE; }
            protected function text_domain(): string      { return 'fides-organization-catalog'; }
            protected function shortcode_root_id(): string { return 'fides-org-catalog-root'; }
            protected function loading_label(): string    { return __('Loading organization catalog…', 'fides-organization-catalog'); }
            protected function max_listing_items(): int   { return self::MAX_LISTING_ITEMS; }

            public function register_with_core(): void {
                if (! class_exists('Fides_Catalog_Registry')) {
                    return;
                }
                Fides_Catalog_Registry::register(self::TYPE, array(
                    'label'             => __('Organizations', 'fides-organization-catalog'),
                    'json_url'          => 'https://raw.githubusercontent.com/FIDEScommunity/fides-organization-catalog/main/data/aggregated.json',
                    'collection_key'    => 'organizations',
                    'id_field'          => 'id',
                    'name_field'        => 'name',
                    'description_field' => 'description',
                    'logo_field'        => 'logoUri',
                    'detail_param'      => 'org',
                    'pages'             => array(
                        'main' => self::catalog_path(),
                    ),
                    'jsonld_type'       => 'Organization',
                ));
            }

            /* --------------------------------------------------------------
             * Settings (admin path for the organization landing page)
             * -------------------------------------------------------------- */

            public static function register_settings(): void {
                register_setting(FIDES_ORG_CATALOG_SETTINGS_GROUP, self::OPTION_CATALOG_URL, array(
                    'type'              => 'string',
                    'default'           => self::DEFAULT_CATALOG_PATH,
                    'sanitize_callback' => array(__CLASS__, 'sanitize_path'),
                ));
            }

            public static function sanitize_path($value): string {
                $value = is_string($value) ? trim($value) : '';
                if ($value === '') {
                    return '';
                }
                $path = wp_parse_url($value, PHP_URL_PATH);
                if (! is_string($path) || $path === '') {
                    return '';
                }
                if ($path[0] !== '/') {
                    $path = '/' . $path;
                }
                return user_trailingslashit($path);
            }

            /* --------------------------------------------------------------
             * Listing page name + URL for CollectionPage JSON-LD
             * -------------------------------------------------------------- */

            protected function listing_page_name(string $page_slug): string {
                return __('Organization Catalog', 'fides-organization-catalog');
            }

            protected function listing_page_url(string $page_slug): string {
                return home_url(self::catalog_path());
            }

            /* --------------------------------------------------------------
             * JSON-LD enrichment
             * -------------------------------------------------------------- */

            protected function enrich_jsonld(array $jsonld, array $item): array {
                if (! empty($item['website'])) {
                    $jsonld['url'] = (string) $item['website'];
                }
                if (! empty($item['logoUri'])) {
                    $jsonld['logo'] = (string) $item['logoUri'];
                }
                if (! empty($item['country']) && is_string($item['country'])) {
                    $jsonld['address'] = array(
                        '@type'       => 'PostalAddress',
                        'addressCountry' => strtoupper(trim($item['country'])),
                    );
                }

                $sectors = $this->list_field($item, 'sectors');
                if (! empty($sectors)) {
                    $jsonld['knowsAbout'] = $sectors;
                    $jsonld['keywords']   = implode(', ', $sectors);
                }

                if (! empty($item['updatedAt']) && is_string($item['updatedAt'])) {
                    $ts = strtotime($item['updatedAt']);
                    if ($ts) {
                        $jsonld['dateModified'] = gmdate('Y-m-d', $ts);
                    }
                }

                return $jsonld;
            }

            /* --------------------------------------------------------------
             * Detail block content (meta rows + chip sections)
             * -------------------------------------------------------------- */

            protected function detail_meta_rows(array $item): array {
                $rows    = array();
                $td      = 'fides-organization-catalog';
                $country = isset($item['country']) && is_string($item['country']) ? strtoupper(trim($item['country'])) : '';
                $website = isset($item['website']) ? trim((string) $item['website']) : '';
                $updated_at = isset($item['updatedAt']) && is_string($item['updatedAt']) ? $item['updatedAt'] : '';

                if ($country !== '') {
                    $rows[] = array(
                        'label' => __('Country', $td),
                        'html'  => esc_html($country),
                    );
                }
                if ($website !== '') {
                    $rows[] = array(
                        'label' => __('Website', $td),
                        'html'  => sprintf(
                            '<a href="%1$s" rel="nofollow noopener" target="_blank">%2$s</a>',
                            esc_url($website),
                            esc_html($website)
                        ),
                    );
                }
                $roles = self::ecosystem_roles_summary($item);
                foreach ($roles as $role) {
                    $rows[] = $role;
                }
                if ($updated_at !== '') {
                    $ts = strtotime($updated_at);
                    if ($ts) {
                        $rows[] = array(
                            'label' => __('Last updated', $td),
                            'html'  => sprintf(
                                '<time datetime="%1$s">%1$s</time>',
                                esc_attr(gmdate('Y-m-d', $ts))
                            ),
                        );
                    }
                }
                return $rows;
            }

            protected function detail_extra_sections(array $item): string {
                $td = 'fides-organization-catalog';
                ob_start();
                echo $this->render_chip_section($this->list_field($item, 'sectors'), __('Sectors', $td));
                return (string) ob_get_clean();
            }

            /* --------------------------------------------------------------
             * Helpers
             * -------------------------------------------------------------- */

            /**
             * Summarise ecosystemRoles into dl rows with counts so the SSR
             * fallback advertises the org's footprint (issuers, credentials,
             * personal/business wallets, RPs).
             *
             * @return array<int, array{label:string, html:string}>
             */
            private static function ecosystem_roles_summary(array $item): array {
                if (empty($item['ecosystemRoles']) || ! is_array($item['ecosystemRoles'])) {
                    return array();
                }
                $td   = 'fides-organization-catalog';
                $rows = array();
                $map  = array(
                    'issuers'           => __('Issuers operated', $td),
                    'credentialTypes'   => __('Credential types issued', $td),
                    'personalWallets'   => __('Personal wallets provided', $td),
                    'businessWallets'   => __('Business wallets provided', $td),
                    'relyingParties'    => __('Relying parties operated', $td),
                );
                foreach ($map as $key => $label) {
                    $value = isset($item['ecosystemRoles'][$key]) ? $item['ecosystemRoles'][$key] : null;
                    if (! is_array($value) || empty($value)) {
                        continue;
                    }
                    $rows[] = array(
                        'label' => $label,
                        'html'  => esc_html(number_format_i18n(count($value))),
                    );
                }
                return $rows;
            }

            private static function catalog_path(): string {
                $opt = (string) get_option(self::OPTION_CATALOG_URL, '');
                return $opt !== '' ? $opt : self::DEFAULT_CATALOG_PATH;
            }
        }
    }
}
