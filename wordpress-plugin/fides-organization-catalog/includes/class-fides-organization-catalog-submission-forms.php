<?php
/**
 * Public submission forms (add organization / suggest update).
 *
 * @package fides-organization-catalog
 */

if (! defined('ABSPATH')) {
    exit;
}

if (! class_exists('Fides_Organization_Catalog_Submission_Forms')) {

    class Fides_Organization_Catalog_Submission_Forms {

        const VERSION = '1.11.1';

        /**
         * @return array<int, array{code: string, label: string}>
         */
        private static function country_options_for_form(): array {
            static $cache = null;
            if ($cache !== null) {
                return $cache;
            }
            $path = plugin_dir_path(dirname(__FILE__)) . 'assets/form-countries.json';
            if (! is_readable($path)) {
                $cache = array();
                return $cache;
            }
            $json = json_decode((string) file_get_contents($path), true);
            $cache = is_array($json) ? $json : array();
            return $cache;
        }

        /**
         * @param string $mode create|update.
         */
        private static function section_intro_for_mode($mode): string {
            if ($mode === 'update') {
                return __('Search for your organization, then review and edit the fields below.', 'fides-organization-catalog');
            }
            return __('Enter the organization information used in the FIDES Trust Explorer.', 'fides-organization-catalog');
        }

        /** @var array<string, string> */
        const FIELD_HELP = array(
            'name'         => 'Display name of the organization.',
            'sectors'      => 'Pick the sector that best describes this organization.',
            'country'      => 'ISO country code, or EU for pan-European organizations.',
            'website'      => 'Public website URL.',
            'logo'         => 'URL to a logo image.',
            'legalName'    => 'Official registered name (e.g. trade register).',
            'description'  => 'Short description of the organization (required in this form).',
            'did'          => 'Decentralized identifier. The crawler can enrich your entry from the DID document.',
            'identifiersBusinessRegistration' => 'Trade register or company registration number (jurisdiction-specific).',
            'identifiersVat'                  => 'VAT or sales tax identification number.',
            'identifiersLei'                  => 'Legal Entity Identifier (ISO 17442).',
            'identifiersEori'                 => 'Economic Operators Registration and Identification (EU customs).',
            'identifiersEuid'                 => 'European Unique Identifier for a legal entity.',
            'identifiersDuns'                 => 'Data Universal Numbering System — a global business identifier from Dun & Bradstreet.',
            'identifiersGln'                  => 'Global Location Number (GS1).',
            'contactSupport'                  => 'Public support page URL shown in the organization profile.',
            'contactPublicEmail'              => 'Public contact email shown in the organization profile and modal.',
            'fidesManifestoSupporter'         => 'Organization has ratified the FIDES Manifesto.',
            'certificationsIntro'             => 'Self-declared certifications shown in the Trust Explorer. Select only what your organization holds.',
            'certificationEvidence'           => 'Optional public link to a certificate, attestation page, or PDF.',
            'diaccComponents'                 => 'Select the DIACC PCTF components your organization is certified for.',
            'certificationsPreserved'         => 'QTSP (eIDAS) entries are imported from the EU Trust List and cannot be edited in this form.',
            'tags'         => 'Comma-separated labels (e.g. FIDES Supporter).',
            'contactEmail' => 'Taken from your FIDES account; used for submission review only, not published as the org contact.',
            'catalogId'    => 'Assigned on submit; matches the folder name after org:.',
            'search'       => 'Search by name or catalog id, then select the correct entry.',
        );

        /** @var array<string, string> */
        const SECTOR_LABELS = array(
            'public_sector'  => 'Public sector',
            'finance'        => 'Finance',
            'trade'          => 'Trade',
            'supply_chain'   => 'Supply chain',
            'manufacturing'  => 'Manufacturing',
            'energy'         => 'Energy',
            'agriculture'    => 'Agriculture',
            'food'           => 'Food',
            'retail'         => 'Retail',
            'healthcare'     => 'Healthcare',
            'education'      => 'Education',
            'construction'   => 'Construction',
            'mobility'       => 'Mobility',
            'digital'        => 'Digital',
        );

        public static function bootstrap(): void {
            add_action('wp_enqueue_scripts', array(__CLASS__, 'register_assets'));
            add_shortcode('fides_organization_submit_form', array(__CLASS__, 'render_submit_shortcode'));
            add_shortcode('fides_organization_update_form', array(__CLASS__, 'render_update_shortcode'));
        }

        public static function register_assets(): void {
            $base = plugin_dir_path(dirname(__FILE__));
            $url  = plugin_dir_url(dirname(__FILE__));

            $css_path = $base . 'assets/organization-form.css';
            $js_path  = $base . 'assets/organization-form.js';
            $css_ver  = file_exists($css_path) ? (string) filemtime($css_path) : self::VERSION;
            $js_ver   = file_exists($js_path) ? (string) filemtime($js_path) : self::VERSION;

            wp_register_style(
                'fides-organization-form',
                $url . 'assets/organization-form.css',
                array(),
                $css_ver
            );
            wp_register_script(
                'fides-organization-form',
                $url . 'assets/organization-form.js',
                array(),
                $js_ver,
                true
            );
        }

        /**
         * @param array<string, mixed> $atts Shortcode attributes.
         */
        public static function render_submit_shortcode($atts = array()): string {
            return self::render_form_shortcode('create', $atts);
        }

        /**
         * @param array<string, mixed> $atts Shortcode attributes.
         */
        public static function render_update_shortcode($atts = array()): string {
            $atts = shortcode_atts(
                array(
                    'org' => '',
                ),
                $atts,
                'fides_organization_update_form'
            );
            $preselect = self::normalize_org_query_param((string) $atts['org']);
            if ($preselect === '' && isset($_GET['org'])) {
                // phpcs:ignore WordPress.Security.NonceVerification.Recommended
                $preselect = self::normalize_org_query_param((string) wp_unslash($_GET['org']));
            }
            return self::render_form_shortcode('update', array('preselectOrgId' => $preselect));
        }

        /**
         * @param string               $mode create|update.
         * @param array<string, mixed> $extra Extra config for inline script.
         */
        private static function render_form_shortcode($mode, array $extra = array()): string {
            if (! class_exists('Fides_Catalog_Submission_Registry')
                || ! Fides_Catalog_Submission_Registry::exists('organization')) {
                return '<div class="fides-use-case-card"><p>' . esc_html__(
                    'Organization submissions are unavailable (missing submission core or adapter).',
                    'fides-organization-catalog'
                ) . '</p></div>';
            }

            if (! is_user_logged_in()) {
                wp_enqueue_style('fides-organization-form');
                $login_url = self::form_login_url();
                return sprintf(
                    '<div class="fides-use-case-card"><p>%s</p><p><a class="fides-org-form-login-link" href="%s">%s</a></p></div>',
                    esc_html__('You must be signed in to submit organization catalog changes.', 'fides-organization-catalog'),
                    esc_url($login_url),
                    esc_html__('Sign in to continue', 'fides-organization-catalog')
                );
            }

            wp_enqueue_style('fides-organization-form');
            wp_enqueue_script('fides-organization-form');

            $user = wp_get_current_user();
            $sectors = array();
            foreach (Fides_Organization_Catalog_Submission_Adapter::SECTOR_CODES as $code) {
                $sectors[] = array(
                    'code'  => $code,
                    'label' => isset(self::SECTOR_LABELS[ $code ]) ? self::SECTOR_LABELS[ $code ] : $code,
                );
            }

            $field_help = self::FIELD_HELP;
            if ($mode === 'update') {
                $field_help['sectors'] = 'Pick one or more sectors that describe this organization.';
            }

            $config = array_merge(
                array(
                    'mode'           => $mode === 'update' ? 'update' : 'create',
                    'apiBase'        => esc_url_raw(rest_url('fides-catalog/v1')),
                    'restNonce'      => wp_create_nonce('wp_rest'),
                    'contactEmail'   => sanitize_email((string) $user->user_email),
                    'sectors'        => $sectors,
                    'countries'      => self::country_options_for_form(),
                    'fieldHelp'      => $field_help,
                    'sectionIntro'   => self::section_intro_for_mode($mode),
                    'selfDeclaredCertifications' => Fides_Organization_Catalog_Submission_Adapter::self_declared_certification_options(),
                    'diaccComponents'            => Fides_Organization_Catalog_Submission_Adapter::diacc_component_options(),
                    'preselectOrgId' => '',
                ),
                $extra
            );

            wp_add_inline_script(
                'fides-organization-form',
                'window.FIDES_ORG_FORM_CONFIG = ' . wp_json_encode($config) . ';',
                'before'
            );

            $root_id = $mode === 'update' ? 'fides-organization-update-form-root' : 'fides-organization-submit-form-root';
            return '<div id="' . esc_attr($root_id) . '" class="fides-org-submission-root"></div>';
        }

        /**
         * Login URL with return_to current page (OID4VP or WP login).
         */
        public static function form_login_url(): string {
            $current_request_uri = isset($_SERVER['REQUEST_URI']) ? wp_unslash($_SERVER['REQUEST_URI']) : '';
            $current_host        = isset($_SERVER['HTTP_HOST']) ? sanitize_text_field(wp_unslash($_SERVER['HTTP_HOST'])) : '';
            $current_url         = $current_host !== ''
                ? ((is_ssl() ? 'https://' : 'http://') . $current_host . $current_request_uri)
                : home_url('/');

            $oid4vp_options = get_option('universal_openid4vp_options', array());
            if (is_array($oid4vp_options) && ! empty($oid4vp_options['loginUrl'])) {
                return esc_url_raw(
                    add_query_arg('return_to', $current_url, (string) $oid4vp_options['loginUrl'])
                );
            }
            return wp_login_url($current_url);
        }

        /**
         * Normalize ?org= query (slug or full org:id).
         */
        private static function normalize_org_query_param($raw): string {
            $raw = sanitize_text_field(trim((string) $raw));
            if ($raw === '') {
                return '';
            }
            if (strpos($raw, 'org:') === 0) {
                return Fides_Catalog_Submission_Registry::is_valid_item_id('organization', $raw) ? $raw : '';
            }
            $candidate = 'org:' . sanitize_title($raw);
            return Fides_Catalog_Submission_Registry::is_valid_item_id('organization', $candidate) ? $candidate : '';
        }
    }
}
