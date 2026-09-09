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
                    self::$instance->bootstrap_share_metadata();
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

            /**
             * Share metadata: org name as OG title, logo when present, otherwise
             * the branded 1200×627 card (LinkedIn ignores listing ?org= and
             * prefers a landscape image).
             */
            private function bootstrap_share_metadata(): void {
                add_filter('fides_catalog_seo_logo_for', array($this, 'filter_seo_share_image'), 20, 3);
                add_filter('fides_catalog_seo_og_title_for', array($this, 'filter_seo_og_title'), 20, 3);
                add_filter('wpseo_opengraph_image', array($this, 'filter_yoast_share_image'), 100);
                add_filter('wpseo_twitter_image', array($this, 'filter_yoast_share_image'), 100);
                add_filter('wpseo_opengraph_title', array($this, 'filter_yoast_share_title'), 1000);
                add_filter('wpseo_twitter_title', array($this, 'filter_yoast_share_title'), 1000);
                add_filter('wpseo_twitter_card_type', array($this, 'filter_yoast_twitter_card'), 100);
                add_filter('wpseo_frontend_presenter_classes', array($this, 'filter_yoast_presenter_classes'), 99);
                add_filter('wpseo_frontend_presenters', array($this, 'filter_yoast_presenters'), 99);
                add_filter('oembed_response_data', array($this, 'filter_oembed_share_title'), 100, 4);
                add_action('wp_head', array($this, 'render_share_image_fallbacks'), 100);
            }

            public static function og_image_url(): string {
                return FIDES_ORG_CATALOG_URL . 'assets/og-organization.jpg';
            }

            /**
             * @param mixed                $name
             * @param string               $type
             * @param array<string, mixed> $item
             * @return mixed
             */
            public function filter_seo_og_title($name, $type, $item) {
                if ($type !== self::TYPE || ! is_array($item)) {
                    return $name;
                }
                $formatted = self::share_title_for_item($item);
                return $formatted !== '' ? $formatted : $name;
            }

            /**
             * @param mixed                $logo
             * @param string               $type
             * @param array<string, mixed> $item
             * @return mixed
             */
            public function filter_seo_share_image($logo, $type, $item) {
                if ($type !== self::TYPE) {
                    return $logo;
                }
                if (is_string($logo) && trim($logo) !== '' && strpos($logo, 'google.com/s2/favicons') === false) {
                    return $logo;
                }
                unset($item);
                return self::og_image_url();
            }

            public function filter_yoast_share_image($image) {
                $item = $this->current_share_item();
                if (! $item) {
                    return $image;
                }
                return self::share_image_url($item);
            }

            public function filter_yoast_share_title($title) {
                $item = $this->current_share_item();
                if (! $item) {
                    return $title;
                }
                $formatted = self::share_title_for_item($item);
                return $formatted !== '' ? $formatted : $title;
            }

            /**
             * LinkedIn prefers oEmbed title over og:title.
             *
             * @param array        $data
             * @param WP_Post|null $post
             * @param int          $width
             * @param int          $height
             * @return array
             */
            public function filter_oembed_share_title($data, $post, $width, $height) {
                unset($post, $width, $height);
                if (! is_array($data)) {
                    return $data;
                }
                // phpcs:ignore WordPress.Security.NonceVerification.Recommended
                $item_url = isset($_GET['url']) ? esc_url_raw(wp_unslash((string) $_GET['url'])) : '';
                $item = $this->current_share_item($item_url);
                if (! $item) {
                    return $data;
                }
                $formatted = self::share_title_for_item($item);
                if ($formatted !== '') {
                    $data['title'] = $formatted;
                }
                return $data;
            }

            /**
             * @param array<string, mixed> $item
             */
            private static function share_title_for_item(array $item): string {
                $name = isset($item['name']) ? trim(wp_strip_all_tags((string) $item['name'])) : '';
                if ($name === '') {
                    return '';
                }
                return $name . ' - FIDES Trust Explorer';
            }

            public function filter_yoast_twitter_card($type) {
                return $this->current_share_item() ? 'summary_large_image' : $type;
            }

            /**
             * @param array<int, string> $classes
             * @return array<int, string>
             */
            public function filter_yoast_presenter_classes($classes) {
                if (! $this->current_share_item() || ! is_array($classes)) {
                    return $classes;
                }
                return array_values(
                    array_filter(
                        $classes,
                        static function ($class) {
                            return is_string($class) && strpos($class, 'Image_Dimensions') === false;
                        }
                    )
                );
            }

            /**
             * @param array<int, object|string> $presenters
             * @return array<int, object|string>
             */
            public function filter_yoast_presenters($presenters) {
                if (! $this->current_share_item() || ! is_array($presenters)) {
                    return $presenters;
                }
                return array_values(
                    array_filter(
                        $presenters,
                        static function ($presenter) {
                            $class = is_object($presenter) ? get_class($presenter) : (string) $presenter;
                            return strpos($class, 'Image_Dimensions') === false;
                        }
                    )
                );
            }

            /**
             * Prefer a real logo; Google favicons are too small for LinkedIn.
             *
             * @param array<string, mixed> $item
             */
            private static function share_image_url(array $item): string {
                $url = isset($item['logoUri']) ? trim((string) $item['logoUri']) : '';
                if ($url === '' || strpos($url, 'google.com/s2/favicons') !== false) {
                    return self::og_image_url();
                }
                return $url;
            }

            public function render_share_image_fallbacks(): void {
                $item = $this->current_share_item();
                if (! $item) {
                    return;
                }
                if (self::share_image_url($item) !== self::og_image_url()) {
                    return;
                }
                echo '<meta property="og:image:width" content="1200" />' . "\n";
                echo '<meta property="og:image:height" content="627" />' . "\n";
            }

            /**
             * @param string $item_url Optional absolute URL (oEmbed `url` query).
             * @return array<string, mixed>|null
             */
            private function current_share_item($item_url = '') {
                if (! function_exists('fides_catalog_ssr_enabled') || ! fides_catalog_ssr_enabled()) {
                    return null;
                }
                if (! class_exists('Fides_Catalog_Registry') || ! class_exists('Fides_Catalog_Source')) {
                    return null;
                }
                $detected = ($item_url !== '' && method_exists('Fides_Catalog_Registry', 'detect_detail_request_from_url'))
                    ? Fides_Catalog_Registry::detect_detail_request_from_url($item_url)
                    : Fides_Catalog_Registry::detect_current_detail_request();
                if (! is_array($detected) || ($detected['type'] ?? '') !== self::TYPE) {
                    return null;
                }
                $source = Fides_Catalog_Source::for(self::TYPE);
                if (! $source) {
                    return null;
                }
                $item = $source->find_by_id((string) $detected['item_id']);
                return is_array($item) ? $item : null;
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
                    'local_json_path'   => dirname(__DIR__) . '/data/aggregated.json',
                    'collection_key'    => 'organizations',
                    'id_field'          => 'id',
                    'name_field'        => 'name',
                    'description_field' => 'description',
                    'logo_field'        => 'logoUri',
                    'detail_param'      => 'org',
                    'pretty_path'       => fides_org_catalog_share_path(),
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

            private static function item_has_full_listing(array $item): bool {
                if (! class_exists('Fides_Catalog_Org_Tier') || ! Fides_Catalog_Org_Tier::tier_ui_enabled()) {
                    return true;
                }
                if (
                    isset($item['catalogListingDepth'])
                    && strtolower(trim((string) $item['catalogListingDepth'])) === 'full'
                ) {
                    return true;
                }
                if (isset($item['catalogTier'])) {
                    $tier = strtolower(trim((string) $item['catalogTier']));
                    if ($tier !== '' && $tier !== 'community' && $tier !== 'gratis') {
                        return true;
                    }
                }
                $org_id = isset($item['id']) ? (string) $item['id'] : '';
                return $org_id !== '' && Fides_Catalog_Org_Tier::has_full_listing($org_id);
            }

            protected function enrich_jsonld(array $jsonld, array $item): array {
                if (! empty($item['website'])) {
                    if (self::item_has_full_listing($item)) {
                        $jsonld['url'] = (string) $item['website'];
                    }
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
                if ($website !== '' && self::item_has_full_listing($item)) {
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
                $role_labels = self::ecosystem_role_code_labels($item);
                if (! empty($role_labels)) {
                    $rows[] = array(
                        'label' => __('Ecosystem roles', $td),
                        'html'  => esc_html(implode(', ', $role_labels)),
                    );
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
                $role_labels = self::ecosystem_role_code_labels($item);
                if (! empty($role_labels)) {
                    echo $this->render_ecosystem_role_chip_section($role_labels, __('Ecosystem roles', $td));
                }
                if (self::item_has_full_listing($item)) {
                    echo $this->render_offering_chip_section(
                        $this->list_field($item, 'offerings'),
                        __('Offerings', $td)
                    );
                    echo $this->render_recognition_sections($item);
                }
                return (string) ob_get_clean();
            }

            /**
             * @param array<string, mixed> $item Organization item.
             */
            private function render_recognition_sections(array $item): string {
                if (empty($item['recognitions']) || ! is_array($item['recognitions'])) {
                    return '';
                }
                $groups = array(
                    'customerStories'       => __('Customer stories', 'fides-organization-catalog'),
                    'awardsAndRecognitions' => __('Awards & recognitions', 'fides-organization-catalog'),
                );
                ob_start();
                foreach ($groups as $key => $title) {
                    $rows = isset($item['recognitions'][ $key ]) && is_array($item['recognitions'][ $key ])
                        ? $item['recognitions'][ $key ]
                        : array();
                    $rows = array_filter(
                        $rows,
                        static function ($row) {
                            return is_array($row) && ! empty($row['title']);
                        }
                    );
                    if (empty($rows)) {
                        continue;
                    }
                    ?>
                    <section class="fides-ssr-detail__section fides-ssr-detail__section--recognitions">
                        <h2 class="fides-ssr-detail__section-title"><?php echo esc_html($title); ?></h2>
                        <ul class="fides-ssr-detail__list">
                            <?php foreach ($rows as $row) : ?>
                                <li>
                                    <?php if (! empty($row['url'])) : ?>
                                        <a href="<?php echo esc_url((string) $row['url']); ?>" rel="nofollow noopener" target="_blank"><?php echo esc_html((string) $row['title']); ?></a>
                                    <?php else : ?>
                                        <?php echo esc_html((string) $row['title']); ?>
                                    <?php endif; ?>
                                </li>
                            <?php endforeach; ?>
                        </ul>
                    </section>
                    <?php
                }
                return (string) ob_get_clean();
            }

            /**
             * Chip section for offerings (green styling in CSS).
             *
             * @param string[] $items
             */
            private function render_offering_chip_section(array $items, string $title): string {
                if (empty($items)) {
                    return '';
                }
                ob_start();
                ?>
                <section class="fides-ssr-detail__section fides-ssr-detail__section--offerings">
                    <h2 class="fides-ssr-detail__section-title"><?php echo esc_html($title); ?></h2>
                    <ul class="fides-ssr-detail__chips">
                        <?php foreach ($items as $chip) : ?>
                            <li class="fides-ssr-detail__chip fides-tag fides-tag--offering"><?php echo esc_html((string) $chip); ?></li>
                        <?php endforeach; ?>
                    </ul>
                </section>
                <?php
                return (string) ob_get_clean();
            }

            /**
             * Chip section for ecosystem roles (modal/SSR parity).
             *
             * @param string[] $items
             */
            private function render_ecosystem_role_chip_section(array $items, string $title): string {
                if (empty($items)) {
                    return '';
                }
                ob_start();
                ?>
                <section class="fides-ssr-detail__section fides-ssr-detail__section--ecosystem-roles">
                    <h2 class="fides-ssr-detail__section-title"><?php echo esc_html($title); ?></h2>
                    <ul class="fides-ssr-detail__chips">
                        <?php foreach ($items as $chip) : ?>
                            <li class="fides-ssr-detail__chip fides-tag fides-tag--ecosystem-role"><?php echo esc_html((string) $chip); ?></li>
                        <?php endforeach; ?>
                    </ul>
                </section>
                <?php
                return (string) ob_get_clean();
            }

            /* --------------------------------------------------------------
             * Helpers
             * -------------------------------------------------------------- */

            /**
             * Human-readable labels for merged ecosystemRoleCodes (SSR detail meta).
             *
             * @return string[]
             */
            private static function ecosystem_role_code_labels(array $item): array {
                if (empty($item['ecosystemRoleCodes']) || ! is_array($item['ecosystemRoleCodes'])) {
                    return array();
                }
                $labels = array();
                if (class_exists('Fides_Organization_Catalog_Submission_Adapter')) {
                    foreach (Fides_Organization_Catalog_Submission_Adapter::ecosystem_role_options() as $option) {
                        if (isset($option['code'], $option['label'])) {
                            $labels[ (string) $option['code'] ] = (string) $option['label'];
                        }
                    }
                }
                $out = array();
                foreach ($item['ecosystemRoleCodes'] as $code) {
                    $code = sanitize_key(str_replace('-', '_', (string) $code));
                    if ($code === '' || in_array($code, $out, true)) {
                        continue;
                    }
                    $out[] = isset($labels[ $code ]) ? $labels[ $code ] : $code;
                }
                return $out;
            }

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
