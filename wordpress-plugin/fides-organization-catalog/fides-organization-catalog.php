<?php
/**
 * Plugin Name: FIDES Organization Catalog
 * Description: Displays the FIDES Community Organization Catalog with filters, search, and ecosystem explorer. When the master fides_catalog_ssr_enabled flag (provided by FIDES Community Tools Tiles ≥ 1.6.3) is enabled, the plugin also emits a server-rendered listing fallback, per-deeplink SEO meta tags and an Organization JSON-LD payload so organization detail URLs become indexable by search engines.
 * Version: 1.3.10
 * Author: FIDES Community
 * License: Apache-2.0
 * Text Domain: fides-organization-catalog
 */

if (!defined('ABSPATH')) exit;

/** @var string Option group for Settings → FIDES Org Catalog */
const FIDES_ORG_CATALOG_SETTINGS_GROUP = 'fides_org_catalog_settings';

require_once plugin_dir_path(__FILE__) . 'includes/class-fides-organization-catalog-ssr.php';
Fides_Organization_Catalog_SSR::bootstrap();

/**
 * Sanitize optional URL: empty string allowed (means “use default behavior”).
 *
 * @param mixed $value Raw option value.
 * @return string
 */
function fides_org_catalog_sanitize_optional_url($value) {
    $value = is_string($value) ? trim($value) : '';
    if ($value === '') {
        return '';
    }
    return esc_url_raw($value);
}

class Fides_Organization_Catalog {

    private static $instance = null;
    private $plugin_url;

    public static function get_instance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        $this->plugin_url = plugin_dir_url(__FILE__);
        add_shortcode('fides_organization_catalog', [$this, 'render_shortcode']);
        add_action('wp_enqueue_scripts', [$this, 'register_assets']);
        add_action('rest_api_init', [$this, 'register_rest_routes']);
        add_action('admin_menu', [$this, 'register_admin_menu']);
        add_action('admin_init', [$this, 'register_plugin_settings']);
    }

    public function register_admin_menu() {
        add_options_page(
            'FIDES Organization Catalog Settings',
            'FIDES Org Catalog',
            'manage_options',
            'fides-organization-catalog',
            [$this, 'render_settings_page']
        );
    }

    public function register_plugin_settings() {
        register_setting(FIDES_ORG_CATALOG_SETTINGS_GROUP, 'fides_org_catalog_github_data_url', [
            'type'              => 'string',
            'default'           => 'https://raw.githubusercontent.com/FIDEScommunity/fides-organization-catalog/main/data/aggregated.json',
            'sanitize_callback' => 'esc_url_raw',
        ]);
        register_setting(FIDES_ORG_CATALOG_SETTINGS_GROUP, 'fides_org_catalog_issuer_catalog_url', [
            'type'              => 'string',
            'default'           => 'https://fides.community/ecosystem-explorer/issuer-catalog/',
            'sanitize_callback' => 'esc_url_raw',
        ]);
        register_setting(FIDES_ORG_CATALOG_SETTINGS_GROUP, 'fides_org_catalog_credential_catalog_url', [
            'type'              => 'string',
            'default'           => 'https://fides.community/ecosystem-explorer/credential-catalog/',
            'sanitize_callback' => 'esc_url_raw',
        ]);
        register_setting(FIDES_ORG_CATALOG_SETTINGS_GROUP, 'fides_org_catalog_wallet_catalog_url', [
            'type'              => 'string',
            'default'           => 'https://fides.community/community-tools/personal-wallets/',
            'sanitize_callback' => 'esc_url_raw',
        ]);
        register_setting(FIDES_ORG_CATALOG_SETTINGS_GROUP, 'fides_org_catalog_rp_catalog_url', [
            'type'              => 'string',
            'default'           => 'https://fides.community/ecosystem-explorer/relying-party-catalog/',
            'sanitize_callback' => 'esc_url_raw',
        ]);
        register_setting(FIDES_ORG_CATALOG_SETTINGS_GROUP, 'fides_org_catalog_blue_pages_profile_base_url', [
            'type'              => 'string',
            'default'           => '',
            'sanitize_callback' => 'fides_org_catalog_sanitize_optional_url',
        ]);
    }

    public function render_settings_page() {
        if (!current_user_can('manage_options')) {
            return;
        }
        ?>
        <div class="wrap">
            <h1><?php echo esc_html__('FIDES Organization Catalog', 'fides-organization-catalog'); ?></h1>
            <form method="post" action="options.php">
                <?php settings_fields(FIDES_ORG_CATALOG_SETTINGS_GROUP); ?>
                <h2 class="title"><?php echo esc_html__('Catalog URLs', 'fides-organization-catalog'); ?></h2>
                <p class="description">
                    <?php echo esc_html__('Defaults are used for the organization catalog shortcode. Shortcode attributes (e.g. credential_catalog_url="…") override these values on that page.', 'fides-organization-catalog'); ?>
                </p>
                <table class="form-table" role="presentation">
                    <tr>
                        <th scope="row">
                            <label for="fides_org_catalog_github_data_url"><?php echo esc_html__('Aggregated JSON URL', 'fides-organization-catalog'); ?></label>
                        </th>
                        <td>
                            <input type="url" class="large-text code" id="fides_org_catalog_github_data_url" name="fides_org_catalog_github_data_url"
                                   value="<?php echo esc_attr(get_option('fides_org_catalog_github_data_url', 'https://raw.githubusercontent.com/FIDEScommunity/fides-organization-catalog/main/data/aggregated.json')); ?>">
                            <p class="description"><?php echo esc_html__('Source URL for organization catalog data (aggregated.json).', 'fides-organization-catalog'); ?></p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="fides_org_catalog_issuer_catalog_url"><?php echo esc_html__('Issuer catalog page URL', 'fides-organization-catalog'); ?></label>
                        </th>
                        <td>
                            <input type="url" class="large-text code" id="fides_org_catalog_issuer_catalog_url" name="fides_org_catalog_issuer_catalog_url"
                                   value="<?php echo esc_attr(get_option('fides_org_catalog_issuer_catalog_url', 'https://fides.community/ecosystem-explorer/issuer-catalog/')); ?>">
                            <p class="description"><?php echo esc_html__('Page with the issuer catalog shortcode (modal deep links).', 'fides-organization-catalog'); ?></p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="fides_org_catalog_credential_catalog_url"><?php echo esc_html__('Credential catalog page URL', 'fides-organization-catalog'); ?></label>
                        </th>
                        <td>
                            <input type="url" class="large-text code" id="fides_org_catalog_credential_catalog_url" name="fides_org_catalog_credential_catalog_url"
                                   value="<?php echo esc_attr(get_option('fides_org_catalog_credential_catalog_url', 'https://fides.community/ecosystem-explorer/credential-catalog/')); ?>">
                            <p class="description"><?php echo esc_html__('Page with the credential catalog shortcode. Used for ?credential=cred:… links from the organization modal.', 'fides-organization-catalog'); ?></p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="fides_org_catalog_wallet_catalog_url"><?php echo esc_html__('Wallet catalog page URL', 'fides-organization-catalog'); ?></label>
                        </th>
                        <td>
                            <input type="url" class="large-text code" id="fides_org_catalog_wallet_catalog_url" name="fides_org_catalog_wallet_catalog_url"
                                   value="<?php echo esc_attr(get_option('fides_org_catalog_wallet_catalog_url', 'https://fides.community/community-tools/personal-wallets/')); ?>">
                            <p class="description"><?php echo esc_html__('Personal wallets catalog page (modal deep links).', 'fides-organization-catalog'); ?></p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="fides_org_catalog_rp_catalog_url"><?php echo esc_html__('Relying party catalog page URL', 'fides-organization-catalog'); ?></label>
                        </th>
                        <td>
                            <input type="url" class="large-text code" id="fides_org_catalog_rp_catalog_url" name="fides_org_catalog_rp_catalog_url"
                                   value="<?php echo esc_attr(get_option('fides_org_catalog_rp_catalog_url', 'https://fides.community/ecosystem-explorer/relying-party-catalog/')); ?>">
                            <p class="description"><?php echo esc_html__('Page with the RP catalog shortcode (modal deep links).', 'fides-organization-catalog'); ?></p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="fides_org_catalog_blue_pages_profile_base_url"><?php echo esc_html__('Blue Pages profile base URL', 'fides-organization-catalog'); ?></label>
                        </th>
                        <td>
                            <input type="url" class="large-text code" id="fides_org_catalog_blue_pages_profile_base_url" name="fides_org_catalog_blue_pages_profile_base_url"
                                   value="<?php echo esc_attr(get_option('fides_org_catalog_blue_pages_profile_base_url', '')); ?>"
                                   placeholder="<?php echo esc_attr(home_url('/community-tools/blue-pages')); ?>">
                            <p class="description"><?php echo esc_html__('Optional. Leave empty to use this site’s /community-tools/blue-pages path. Used for “Open full profile” in the modal.', 'fides-organization-catalog'); ?></p>
                        </td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>
        </div>
        <?php
    }

    /**
     * Public REST proxy for Blue Pages validations (avoids browser CORS).
     * GET fides-org-catalog/v1/blue-pages?did=did%3Aweb%3A...
     */
    public function register_rest_routes() {
        register_rest_route('fides-org-catalog/v1', '/blue-pages', [
            'methods'             => 'GET',
            'callback'            => [$this, 'rest_blue_pages_validations'],
            'permission_callback' => '__return_true',
            'args'                => [
                'did' => [
                    'required'          => true,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ],
            ],
        ]);
    }

    /**
     * Resolve Blue Pages API base URL (shared with fides-blue-pages when active).
     */
    private function get_blue_pages_api_base() {
        $default = 'https://bluepages.fides.community/api/public/did';
        if (class_exists('BluePages_Fides_Plugin')) {
            $default = BluePages_Fides_Plugin::get_api_url();
        }
        return apply_filters('fides_org_catalog_blue_pages_api_url', $default);
    }

    /**
     * Map raw Blue Pages / gateway errors to short, public-safe copy (no Java stack traces).
     *
     * @param string $message   Raw upstream message.
     * @param int    $http_code HTTP status from upstream, or 0 if unknown.
     */
    private function sanitize_blue_pages_client_error_message($message, $http_code = 0) {
        $message = is_string($message) ? trim($message) : '';
        $lower   = strtolower($message);

        if (strpos($lower, 'illegalargumentexception') !== false
            || strpos($lower, 'java.lang.') !== false
            || strpos($lower, 'nosuchelementexception') !== false
            || strpos($lower, 'nullpointerexception') !== false) {
            return 'This DID is not registered in Blue Pages yet. Verified credentials will appear after the organization completes Blue Pages registration.';
        }

        if ($http_code === 404 || (strpos($lower, 'not found') !== false && strpos($lower, 'did') !== false)) {
            return 'This DID was not found in Blue Pages.';
        }

        if ($http_code >= 500 || strpos($lower, 'internal server error') !== false) {
            return 'Blue Pages could not load this profile. The DID may not be registered yet.';
        }

        if ($message === '' || $message === 'Upstream error') {
            return 'This DID is not registered in Blue Pages yet, or the profile could not be loaded.';
        }

        if (strlen($message) > 200 || strpos($message, '<') !== false || strpos($message, "\n") !== false) {
            return 'Blue Pages could not load this profile.';
        }

        return $message;
    }

    /**
     * @param WP_REST_Request $request
     * @return WP_REST_Response|WP_Error
     */
    public function rest_blue_pages_validations($request) {
        $did = (string) $request->get_param('did');
        $did = trim($did);

        if ($did === '' || strlen($did) > 768) {
            return new WP_REST_Response([
                'ok'    => false,
                'error' => 'Invalid DID parameter.',
            ], 400);
        }

        if (stripos($did, 'did:') !== 0) {
            return new WP_REST_Response([
                'ok'    => false,
                'error' => 'Only did: identifiers are allowed.',
            ], 400);
        }

        if (preg_match('#\s#', $did)) {
            return new WP_REST_Response([
                'ok'    => false,
                'error' => 'Invalid DID format.',
            ], 400);
        }

        $base = rtrim($this->get_blue_pages_api_base(), '/');
        $url  = $base . '/' . rawurlencode($did) . '/validations';

        $response = wp_remote_get($url, [
            'timeout' => 20,
            'headers' => [
                'Accept' => 'application/json',
            ],
        ]);

        if (is_wp_error($response)) {
            $err = $response->get_error_message();
            return new WP_REST_Response([
                'ok'    => false,
                'error' => $this->sanitize_blue_pages_client_error_message($err, 0),
            ], 200);
        }

        $code = (int) wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        $json = json_decode($body, true);

        if ($code >= 400) {
            $raw = '';
            if (is_array($json)) {
                $raw = (string) ($json['message'] ?? $json['title'] ?? $json['error'] ?? '');
            }
            if ($raw === '') {
                $raw = 'Upstream error';
            }
            $msg = $this->sanitize_blue_pages_client_error_message($raw, $code);
            return new WP_REST_Response([
                'ok'       => false,
                'error'    => $msg,
                'httpCode' => $code,
            ], 200);
        }

        if (!is_array($json)) {
            return new WP_REST_Response([
                'ok'    => false,
                'error' => $this->sanitize_blue_pages_client_error_message('Invalid JSON from Blue Pages API.', $code),
            ], 200);
        }

        return new WP_REST_Response([
            'ok'        => true,
            'data'      => $json,
            'fetchedAt' => gmdate('c'),
        ], 200);
    }

    public function register_assets() {
        $plugin_dir = plugin_dir_path(__FILE__);
        $ui_lib_css_path = $plugin_dir . 'assets/lib/fides-catalog-ui.css';
        $ui_lib_js_path = $plugin_dir . 'assets/lib/fides-catalog-ui.js';
        $ui_lib_css_version = file_exists($ui_lib_css_path) ? filemtime($ui_lib_css_path) : '1.3.10';
        $ui_lib_js_version = file_exists($ui_lib_js_path) ? filemtime($ui_lib_js_path) : '1.3.10';

        wp_register_style(
            'fides-organization-catalog',
            $this->plugin_url . 'assets/style.css',
            [],
            '1.3.10'
        );
        wp_register_style(
            'fides-organization-catalog-ui-lib',
            $this->plugin_url . 'assets/lib/fides-catalog-ui.css',
            array('fides-organization-catalog'),
            $ui_lib_css_version
        );
        wp_register_script(
            'fides-organization-catalog-ui-lib',
            $this->plugin_url . 'assets/lib/fides-catalog-ui.js',
            [],
            $ui_lib_js_version,
            true
        );
        wp_register_script(
            'fides-organization-catalog',
            $this->plugin_url . 'assets/organization-catalog.js',
            array('fides-organization-catalog-ui-lib'),
            '1.3.10',
            true
        );
    }

    public function render_shortcode($atts) {
        $atts = shortcode_atts([
            'show_filters' => 'true',
            'show_search'  => 'true',
            'columns'      => '3',
            'theme'        => 'fides',
            'github_data_url' => get_option(
                'fides_org_catalog_github_data_url',
                'https://raw.githubusercontent.com/FIDEScommunity/fides-organization-catalog/main/data/aggregated.json'
            ),
            'issuer_catalog_url' => get_option(
                'fides_org_catalog_issuer_catalog_url',
                'https://fides.community/ecosystem-explorer/issuer-catalog/'
            ),
            'credential_catalog_url' => get_option(
                'fides_org_catalog_credential_catalog_url',
                'https://fides.community/ecosystem-explorer/credential-catalog/'
            ),
            'wallet_catalog_url' => get_option(
                'fides_org_catalog_wallet_catalog_url',
                'https://fides.community/community-tools/personal-wallets/'
            ),
            'rp_catalog_url' => get_option(
                'fides_org_catalog_rp_catalog_url',
                'https://fides.community/ecosystem-explorer/relying-party-catalog/'
            ),
            /** Base URL for “Open full profile” (trailing slash optional). Empty = settings option or home_url('/community-tools/blue-pages/'). */
            'blue_pages_profile_base_url' => '',
        ], $atts, 'fides_organization_catalog');

        wp_enqueue_style('fides-organization-catalog');
        wp_enqueue_style('fides-organization-catalog-ui-lib');
        wp_enqueue_script('fides-organization-catalog');

        $bp_shortcode = trim((string) $atts['blue_pages_profile_base_url']);
        if ($bp_shortcode !== '') {
            $bp_profile_base = trailingslashit(esc_url_raw($bp_shortcode));
        } else {
            $bp_opt = trim((string) get_option('fides_org_catalog_blue_pages_profile_base_url', ''));
            if ($bp_opt !== '') {
                $bp_profile_base = trailingslashit(esc_url_raw($bp_opt));
            } else {
                $bp_profile_base = trailingslashit(home_url('/community-tools/blue-pages'));
            }
        }

        wp_localize_script('fides-organization-catalog', 'fidesOrganizationCatalog', [
            'pluginUrl'            => $this->plugin_url,
            'githubDataUrl'        => $atts['github_data_url'],
            'issuerCatalogUrl'     => $atts['issuer_catalog_url'],
            'credentialCatalogUrl' => $atts['credential_catalog_url'],
            'walletCatalogUrl'     => $atts['wallet_catalog_url'],
            'rpCatalogUrl'         => $atts['rp_catalog_url'],
            'bluePagesRestUrl'     => rest_url('fides-org-catalog/v1/blue-pages'),
            'bluePagesProfileBaseUrl' => $bp_profile_base,
        ]);

        $initial_html = '';
        if (class_exists('Fides_Organization_Catalog_SSR')) {
            $initial_html = Fides_Organization_Catalog_SSR::build_initial_html(array(
                'show_filters' => $atts['show_filters'],
                'show_search'  => $atts['show_search'],
                'columns'      => $atts['columns'],
                'theme'        => $atts['theme'],
            ));
        }
        if ($initial_html === '') {
            $initial_html = '<p>Loading Organization Catalog…</p>';
        }

        return sprintf(
            '<div id="fides-org-catalog-root" data-show-filters="%s" data-show-search="%s" data-columns="%s" data-theme="%s">%s</div>',
            esc_attr($atts['show_filters']),
            esc_attr($atts['show_search']),
            esc_attr($atts['columns']),
            esc_attr($atts['theme']),
            $initial_html
        );
    }
}

Fides_Organization_Catalog::get_instance();
