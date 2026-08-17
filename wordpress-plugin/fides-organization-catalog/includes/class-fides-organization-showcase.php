<?php
/**
 * Homepage organization showcase shortcode.
 *
 * @package Fides_Organization_Catalog
 */

if (! defined('ABSPATH')) {
    exit;
}

final class Fides_Organization_Showcase {
    private const USE_CASE_DATA_URL = 'https://raw.githubusercontent.com/FIDEScommunity/fides-use-case-catalog/main/data/aggregated.json';

    public static function bootstrap(): void {
        add_shortcode('fides_organization_showcase', array(__CLASS__, 'render'));
        add_action('wp_enqueue_scripts', array(__CLASS__, 'register_assets'));
    }

    public static function register_assets(): void {
        wp_register_style(
            'fides-organization-showcase',
            FIDES_ORG_CATALOG_URL . 'assets/organization-showcase.css',
            array(),
            FIDES_ORG_CATALOG_VERSION
        );
        wp_register_script(
            'fides-organization-showcase',
            FIDES_ORG_CATALOG_URL . 'assets/organization-showcase.js',
            array(),
            FIDES_ORG_CATALOG_VERSION,
            true
        );
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private static function organization_items(): array {
        if (class_exists('Fides_Catalog_Source')) {
            $source = Fides_Catalog_Source::for('organization');
            if ($source) {
                $items = $source->all();
                if (is_array($items) && $items !== array()) {
                    return array_values(array_filter($items, 'is_array'));
                }
            }
        }

        $path = FIDES_ORG_CATALOG_PATH . 'data/aggregated.json';
        $json = is_readable($path) ? file_get_contents($path) : false;
        $data = is_string($json) ? json_decode($json, true) : null;
        return is_array($data) && isset($data['organizations']) && is_array($data['organizations'])
            ? array_values(array_filter($data['organizations'], 'is_array'))
            : array();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private static function use_case_items(): array {
        if (class_exists('Fides_Catalog_Source')) {
            $source = Fides_Catalog_Source::for('usecase');
            if ($source) {
                $items = $source->all();
                if (is_array($items) && $items !== array()) {
                    return array_values(array_filter($items, 'is_array'));
                }
            }
        }

        $url = (string) get_option('fides_org_catalog_use_case_aggregated_url', self::USE_CASE_DATA_URL);
        if ($url === '') {
            return array();
        }
        $cache_key = 'fides_org_showcase_uc_' . md5($url);
        $cached = get_transient($cache_key);
        if (is_array($cached)) {
            return $cached;
        }

        $response = wp_safe_remote_get($url, array(
            'timeout' => 8,
            'headers' => array('Accept' => 'application/json'),
        ));
        if (is_wp_error($response) || wp_remote_retrieve_response_code($response) !== 200) {
            return array();
        }
        $data = json_decode((string) wp_remote_retrieve_body($response), true);
        $items = is_array($data) && isset($data['useCases']) && is_array($data['useCases'])
            ? array_values(array_filter($data['useCases'], 'is_array'))
            : array();
        if ($items !== array()) {
            set_transient($cache_key, $items, HOUR_IN_SECONDS);
        }
        return $items;
    }

    /**
     * @param array<int, array<string, mixed>> $items
     * @return array<string, int>
     */
    private static function use_case_counts(array $items): array {
        $counts = array();
        foreach ($items as $item) {
            $links = isset($item['links']['organizations']) && is_array($item['links']['organizations'])
                ? $item['links']['organizations']
                : array();
            $seen = array();
            foreach ($links as $link) {
                $id = is_array($link) ? trim((string) ($link['refId'] ?? '')) : '';
                if ($id === '' || strpos($id, 'org:') !== 0 || isset($seen[ $id ])) {
                    continue;
                }
                $seen[ $id ] = true;
                $counts[ $id ] = isset($counts[ $id ]) ? $counts[ $id ] + 1 : 1;
            }
        }
        return $counts;
    }

    /**
     * @param array<int, array<string, mixed>> $organizations
     * @return array<int, array<string, mixed>>
     */
    private static function daily_order(array $organizations): array {
        $seed = function_exists('wp_date') ? wp_date('Y-m-d') : gmdate('Y-m-d');
        usort($organizations, static function (array $left, array $right) use ($seed): int {
            $left_score = hash('sha256', $seed . '|' . (string) ($left['id'] ?? ''));
            $right_score = hash('sha256', $seed . '|' . (string) ($right['id'] ?? ''));
            return strcmp($left_score, $right_score);
        });
        return $organizations;
    }

    /**
     * @param array<string, mixed> $organization
     * @return array<int, string>
     */
    private static function role_labels(array $organization): array {
        $labels = array(
            'personal_wallet_provider'           => __('Personal wallet provider', 'fides-organization-catalog'),
            'business_wallet_provider'           => __('Business wallet provider', 'fides-organization-catalog'),
            'vc_type_authority'                  => __('VC type authority', 'fides-organization-catalog'),
            'issuer'                             => __('Issuer', 'fides-organization-catalog'),
            'relying_party'                      => __('Relying party', 'fides-organization-catalog'),
            'idv_provider'                       => __('IDV provider', 'fides-organization-catalog'),
            'kyb_provider'                       => __('KYB provider', 'fides-organization-catalog'),
            'system_integrator'                  => __('System integrator', 'fides-organization-catalog'),
            'consultancy'                        => __('Consultancy', 'fides-organization-catalog'),
            'software_vendor'                    => __('Software vendor', 'fides-organization-catalog'),
            'business_registry'                  => __('Business registry', 'fides-organization-catalog'),
            'industry_association'               => __('Industry association', 'fides-organization-catalog'),
            'standards_development_organization' => __('Standards organization', 'fides-organization-catalog'),
            'eidas_trust_service_provider'       => __('Trust service provider', 'fides-organization-catalog'),
            'trust_infrastructure_provider'      => __('Trust infrastructure', 'fides-organization-catalog'),
            'interop_testbed_operator'           => __('Interop testbed operator', 'fides-organization-catalog'),
        );
        $codes = isset($organization['ecosystemRoleCodes']) && is_array($organization['ecosystemRoleCodes'])
            ? $organization['ecosystemRoleCodes']
            : array();
        $result = array();
        foreach ($codes as $code) {
            $key = sanitize_key((string) $code);
            if ($key !== '' && isset($labels[ $key ])) {
                $result[] = $labels[ $key ];
            }
        }
        return array_values(array_unique($result));
    }

    private static function country_label(string $code): string {
        $code = strtoupper(trim($code));
        if (! preg_match('/^[A-Z]{2}$/', $code)) {
            return '';
        }
        if (class_exists('Locale')) {
            $label = \Locale::getDisplayRegion('-' . $code, 'en');
            if (is_string($label) && $label !== '' && strtoupper($label) !== $code) {
                return $label;
            }
        }
        return $code;
    }

    private static function catalog_url(): string {
        $path = trim((string) get_option('fides_org_catalog_page_url', '/organizations/'));
        if ($path === '') {
            $path = '/organizations/';
        }
        return preg_match('#^https?://#i', $path) ? $path : home_url($path);
    }

    /**
     * Count registered WordPress accounts on this site (FIDES Explorer users).
     */
    private static function active_user_count(): int {
        $cached = get_transient('fides_org_showcase_active_users');
        if (is_numeric($cached)) {
            return max(0, (int) $cached);
        }

        $count = 0;
        if (function_exists('count_users')) {
            $stats = count_users();
            $count = isset($stats['total_users']) ? max(0, (int) $stats['total_users']) : 0;
        }
        $count = (int) apply_filters('fides_org_showcase_active_user_count', $count);
        set_transient('fides_org_showcase_active_users', $count, HOUR_IN_SECONDS);
        return max(0, $count);
    }

    /**
     * @param array<string, mixed> $atts
     */
    public static function render(array $atts = array()): string {
        $atts = shortcode_atts(array(
            'catalog_url'      => '',
            'cards'            => '12',
            'show_profile_cta' => '1',
        ), $atts, 'fides_organization_showcase');

        self::register_assets();
        wp_enqueue_style('fides-organization-showcase');
        wp_enqueue_script('fides-organization-showcase');

        $organizations = self::organization_items();
        $counts = self::use_case_counts(self::use_case_items());
        $index = array();
        foreach ($organizations as $organization) {
            $id = trim((string) ($organization['id'] ?? ''));
            if ($id !== '') {
                $index[ $id ] = $organization;
            }
        }

        $eligible = array();
        foreach ($counts as $id => $count) {
            if ($id === 'org:fides') {
                continue;
            }
            if (! isset($index[ $id ])) {
                continue;
            }
            $organization = $index[ $id ];
            $logo = trim((string) ($organization['logoUri'] ?? ($organization['logo'] ?? '')));
            $name = trim((string) ($organization['name'] ?? ''));
            if ($logo === '' || $name === '') {
                continue;
            }
            $organization['_showcaseUseCaseCount'] = $count;
            $eligible[] = $organization;
        }
        if ($eligible === array()) {
            return '';
        }

        $limit = min(24, max(4, absint($atts['cards'])));
        $selected = array_slice(self::daily_order($eligible), 0, $limit);
        $official_count = count(array_filter($organizations, static function (array $organization): bool {
            return strtolower(trim((string) ($organization['catalogTier'] ?? ''))) === 'pro';
        }));
        $active_user_count = self::active_user_count();
        $catalog_url = trim((string) $atts['catalog_url']);
        $catalog_url = $catalog_url !== '' ? $catalog_url : self::catalog_url();
        $show_profile_cta = ! in_array(
            strtolower((string) $atts['show_profile_cta']),
            array('0', 'false', 'no', 'off'),
            true
        );
        $carousel_id = function_exists('wp_unique_id')
            ? wp_unique_id('fides-org-showcase-')
            : 'fides-org-showcase-' . substr(md5(uniqid('', true)), 0, 8);

        ob_start();
        ?>
        <section class="fides-org-showcase" aria-label="<?php esc_attr_e('Organizations in the FIDES ecosystem', 'fides-organization-catalog'); ?>">
            <div class="fides-org-showcase__toolbar">
                <div class="fides-org-showcase__metric" aria-label="<?php esc_attr_e('Organization catalog statistics', 'fides-organization-catalog'); ?>">
                    <strong class="fides-org-showcase__count" data-count="<?php echo esc_attr((string) count($organizations)); ?>"
                            style="--fides-count-width:<?php echo esc_attr((string) max(1, strlen(number_format_i18n(count($organizations))))) . 'ch'; ?>"><?php echo esc_html(number_format_i18n(count($organizations))); ?></strong>
                    <span class="fides-org-showcase__metric-label">
                        <span class="fides-org-showcase__metric-label--full"><?php esc_html_e('Organisations', 'fides-organization-catalog'); ?></span>
                        <span class="fides-org-showcase__metric-label--short" aria-hidden="true"><?php esc_html_e('Orgs', 'fides-organization-catalog'); ?></span>
                    </span>
                </div>
                <div class="fides-org-showcase__metric fides-org-showcase__metric--official">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                         aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                    <strong class="fides-org-showcase__count" data-count="<?php echo esc_attr((string) $official_count); ?>"
                            style="--fides-count-width:<?php echo esc_attr((string) max(1, strlen(number_format_i18n($official_count)))) . 'ch'; ?>"><?php echo esc_html(number_format_i18n($official_count)); ?></strong>
                    <span class="fides-org-showcase__metric-label">
                        <span class="fides-org-showcase__metric-label--full"><?php esc_html_e('Official Listings', 'fides-organization-catalog'); ?></span>
                        <span class="fides-org-showcase__metric-label--short" aria-hidden="true"><?php esc_html_e('Official', 'fides-organization-catalog'); ?></span>
                    </span>
                </div>
                <div class="fides-org-showcase__metric fides-org-showcase__metric--users">
                    <strong class="fides-org-showcase__count" data-count="<?php echo esc_attr((string) $active_user_count); ?>"
                            style="--fides-count-width:<?php echo esc_attr((string) max(1, strlen(number_format_i18n($active_user_count)))) . 'ch'; ?>"><?php echo esc_html(number_format_i18n($active_user_count)); ?></strong>
                    <span class="fides-org-showcase__metric-label">
                        <span class="fides-org-showcase__metric-label--full"><?php esc_html_e('Active users in the FIDES Explorer', 'fides-organization-catalog'); ?></span>
                        <span class="fides-org-showcase__metric-label--short" aria-hidden="true"><?php esc_html_e('Users', 'fides-organization-catalog'); ?></span>
                    </span>
                </div>
                <a class="fides-org-showcase__toolbar-link" href="<?php echo esc_url($catalog_url); ?>"
                   data-matomo-category="Organization Showcase" data-matomo-action="View all organizations">
                    <?php esc_html_e('Explore all organisations', 'fides-organization-catalog'); ?>
                    <span aria-hidden="true">→</span>
                </a>
            </div>

            <div class="fides-org-showcase__carousel" data-fides-org-carousel>
                <button class="fides-org-showcase__control is-previous" type="button" data-carousel-direction="-1"
                        aria-controls="<?php echo esc_attr($carousel_id); ?>" aria-label="<?php esc_attr_e('Previous organizations', 'fides-organization-catalog'); ?>">
                    <span aria-hidden="true">←</span>
                </button>
                <div class="fides-org-showcase__viewport" id="<?php echo esc_attr($carousel_id); ?>" tabindex="0">
                    <div class="fides-org-showcase__track">
                        <?php foreach ($selected as $organization) : ?>
                            <?php
                            $id = (string) $organization['id'];
                            $name = (string) $organization['name'];
                            $logo = (string) ($organization['logoUri'] ?? ($organization['logo'] ?? ''));
                            $count = (int) $organization['_showcaseUseCaseCount'];
                            $is_managed = strtolower((string) ($organization['catalogTier'] ?? '')) === 'pro';
                            $roles = self::role_labels($organization);
                            $visible_roles = array_slice($roles, 0, 2);
                            $hidden_role_count = max(0, count($roles) - count($visible_roles));
                            $country_code = strtoupper(trim((string) ($organization['country'] ?? '')));
                            $country_label = self::country_label($country_code);
                            $country_flag_url = preg_match('/^[A-Z]{2}$/', $country_code)
                                ? 'https://flagcdn.com/w40/' . strtolower($country_code) . '.png'
                                : '';
                            $detail_url = add_query_arg('org', $id, $catalog_url);
                            ?>
                            <a class="fides-org-showcase__card" href="<?php echo esc_url($detail_url); ?>"
                               data-matomo-category="Organization Showcase" data-matomo-action="Open organization"
                               data-matomo-name="<?php echo esc_attr($name); ?>">
                                <span class="fides-org-showcase__header">
                                    <span class="fides-org-showcase__identity">
                                        <span class="fides-org-showcase__title-row">
                                            <strong class="fides-org-showcase__name"><?php echo esc_html($name); ?></strong>
                                            <?php if ($country_flag_url !== '' && $country_label !== '') : ?>
                                                <span class="fides-org-showcase__country" role="img"
                                                      aria-label="<?php echo esc_attr($country_label); ?>"
                                                      title="<?php echo esc_attr($country_label); ?>">
                                                    <img src="<?php echo esc_url($country_flag_url); ?>" alt="" width="18" height="13" loading="lazy" decoding="async">
                                                </span>
                                            <?php endif; ?>
                                            <?php if ($is_managed) : ?>
                                                <span class="fides-org-showcase__official-icon" role="img"
                                                      aria-label="<?php esc_attr_e('Official Listing', 'fides-organization-catalog'); ?>"
                                                      title="<?php esc_attr_e('Official listing — managed by the provider', 'fides-organization-catalog'); ?>">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                                                         stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                                                         aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                                                </span>
                                            <?php endif; ?>
                                        </span>
                                    </span>
                                </span>
                                <span class="fides-org-showcase__logo">
                                    <img src="<?php echo esc_url($logo); ?>" alt="" loading="lazy" decoding="async">
                                </span>
                                <span class="fides-org-showcase__use-cases">
                                    <?php
                                    printf(
                                        esc_html(_n('Active in %s documented use case', 'Active in %s documented use cases', $count, 'fides-organization-catalog')),
                                        esc_html(number_format_i18n($count))
                                    );
                                    ?>
                                </span>
                                <span class="fides-org-showcase__roles"<?php echo $roles === array() ? ' aria-hidden="true"' : ''; ?>>
                                    <?php foreach ($visible_roles as $role) : ?>
                                        <span><?php echo esc_html($role); ?></span>
                                    <?php endforeach; ?>
                                    <?php if ($hidden_role_count > 0) : ?>
                                        <span class="fides-org-showcase__role-more"
                                              title="<?php echo esc_attr(implode(', ', array_slice($roles, 2))); ?>">
                                            <?php echo esc_html('+' . number_format_i18n($hidden_role_count)); ?>
                                        </span>
                                    <?php endif; ?>
                                </span>
                            </a>
                        <?php endforeach; ?>
                    </div>
                </div>
                <button class="fides-org-showcase__control is-next" type="button" data-carousel-direction="1"
                        aria-controls="<?php echo esc_attr($carousel_id); ?>" aria-label="<?php esc_attr_e('Next organizations', 'fides-organization-catalog'); ?>">
                    <span aria-hidden="true">→</span>
                </button>
                <span class="fides-org-showcase__position" data-carousel-position aria-live="polite"></span>
            </div>

            <?php if ($show_profile_cta) : ?>
                <div class="fides-org-showcase__profile-cta">
                    <div>
                        <strong><?php esc_html_e('Is your organisation already listed?', 'fides-organization-catalog'); ?></strong>
                        <span><?php esc_html_e('Find your profile, see how your organisation appears in the FIDES ecosystem and check whether the information is complete.', 'fides-organization-catalog'); ?></span>
                    </div>
                    <a href="<?php echo esc_url($catalog_url); ?>" data-matomo-category="Organization Showcase" data-matomo-action="Find organization">
                        <?php esc_html_e('Find your organisation', 'fides-organization-catalog'); ?>
                        <span aria-hidden="true">→</span>
                    </a>
                </div>
            <?php endif; ?>
        </section>
        <?php
        return (string) ob_get_clean();
    }
}
