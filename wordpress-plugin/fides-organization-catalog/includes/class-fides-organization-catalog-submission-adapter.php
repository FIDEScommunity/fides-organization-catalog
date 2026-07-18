<?php
/**
 * Registers the organization catalog with the shared submission core.
 *
 * @package fides-organization-catalog
 */

if (! defined('ABSPATH')) {
    exit;
}

if (! class_exists('Fides_Organization_Catalog_Submission_Adapter')) {

    class Fides_Organization_Catalog_Submission_Adapter {

        const TYPE = 'organization';

        /** @var string[] */
        const SECTOR_CODES = array(
            'public_sector',
            'finance',
            'trade',
            'supply_chain',
            'manufacturing',
            'energy',
            'agriculture',
            'food',
            'retail',
            'healthcare',
            'education',
            'construction',
            'mobility',
            'digital',
        );

        /** @var string[] Self-declared certification codes editable via the public form. */
        const SELF_DECLARED_CERT_CODES = array(
            'iso27001',
            'iso27701',
            'soc2',
            'diacc',
        );

        /** @var string[] Certification codes maintained outside the public form (import pipelines). */
        const PRESERVED_CERT_CODES = array(
            'qtsp',
        );

        /** @var string[] */
        const DIACC_COMPONENT_CODES = array(
            'digital_wallet',
            'verified_person',
            'privacy',
        );

        /** @var string[] Closed ecosystem role taxonomy (optional multi-select in forms). */
        const ECOSYSTEM_ROLE_CODES = array(
            'personal_wallet_provider',
            'business_wallet_provider',
            'vc_type_authority',
            'issuer',
            'relying_party',
            'idv_provider',
            'kyb_provider',
            'system_integrator',
            'consultancy',
            'software_vendor',
            'business_registry',
            'industry_association',
            'standards_development_organization',
            'conformity_scheme_owner',
            'national_accreditation_body',
            'certification_body',
            'conformity_assessment_body',
            'eudi_wallet_intermediary',
            'eidas_trust_service_provider',
            'trust_infrastructure_provider',
        );

        /** Maximum number of offerings per organization. */
        const OFFERINGS_MAX_ITEMS = 15;

        /** Maximum length of a single offering label. */
        const OFFERING_MAX_LENGTH = 80;

        /** @var string[] Starter suggestions for the offerings chip autocomplete. */
        const OFFERINGS_SEED_SUGGESTIONS = array(
            'Consulting',
            'Digital identity advisory',
            'EUDI Wallet integration',
            'Identity verification',
            'Implementation support',
            'OID4VCI integration',
            'OID4VP integration',
            'Pilot programme',
            'QEAA consulting',
            'Technical training',
            'Trust framework advisory',
            'Wallet implementation',
        );

        public static function bootstrap(): void {
            add_action('init', array(__CLASS__, 'register'), 6);
            add_filter('fides_catalog_submission_public_item_url', array(__CLASS__, 'filter_public_item_url'), 10, 4);
        }

        public static function register(): void {
            if (! class_exists('Fides_Catalog_Submission_Registry')) {
                return;
            }

            Fides_Catalog_Submission_Registry::register(
                self::TYPE,
                array(
                    'label'                 => __('Organizations', 'fides-organization-catalog'),
                    'catalog_type'          => self::TYPE,
                    'id_pattern'            => '/^org:[a-z0-9]+(?:-[a-z0-9]+)*$/',
                    'community_filename'    => 'organization-catalog.json',
                    'slug_from_item_id'     => array(__CLASS__, 'slug_from_item_id'),
                    'validate_payload'      => array(__CLASS__, 'validate_payload'),
                    'payload_to_export'     => array(__CLASS__, 'payload_to_export'),
                    'catalog_item_to_payload' => array(__CLASS__, 'catalog_item_to_payload'),
                    'diff_field_labels'     => array(
                        'id'              => 'Catalog id',
                        'name'            => 'Organization name',
                        'sectors'         => 'Sectors',
                        'country'         => 'Country',
                        'website'         => 'Website',
                        'logo'            => 'Logo URL',
                        'legalName'       => 'Legal name',
                        'description'     => 'Description',
                        'tags'            => 'Tags',
                        'offerings'       => 'Offerings',
                        'identifiers.business_registration_number' => 'Business registration number',
                        'identifiers.vat_number'                   => 'VAT number',
                        'identifiers.lei'                          => 'LEI',
                        'identifiers.eori'                         => 'EORI',
                        'identifiers.euid'                         => 'EUID',
                        'identifiers.duns'                         => 'D-U-N-S',
                        'identifiers.gln'                          => 'GLN',
                        'identifiers.did'                          => 'DID',
                        'contact.email'                            => 'Contact email',
                        'contact.bookMeetingUrl'                   => 'Book a meeting URL',
                        'fidesManifestoSupporter'                  => 'FIDES Manifesto supporter',
                        'ecosystemRoleCodes'                       => 'Ecosystem roles',
                        'certifications'                           => 'Certifications',
                        'media.videos'                             => 'Media videos',
                        'media.images'                             => 'Media images',
                    ),
                )
            );
        }

        /**
         * @return array<int, array{code: string, label: string}>
         */
        public static function self_declared_certification_options(): array {
            $labels = array(
                'iso27001' => 'ISO/IEC 27001',
                'iso27701' => 'ISO/IEC 27701',
                'soc2'     => 'SOC 2',
                'diacc'    => 'DIACC Certified',
            );
            $out = array();
            foreach (self::SELF_DECLARED_CERT_CODES as $code) {
                $out[] = array(
                    'code'  => $code,
                    'label' => isset($labels[ $code ]) ? $labels[ $code ] : $code,
                );
            }
            return $out;
        }

        /**
         * @return array<int, array{code: string, label: string}>
         */
        public static function ecosystem_role_options(): array {
            $labels = array(
                'personal_wallet_provider'           => 'Personal Wallet Provider',
                'business_wallet_provider'           => 'Business Wallet Provider',
                'vc_type_authority'                  => 'VC Type Authority',
                'issuer'                             => 'Issuer',
                'relying_party'                      => 'Relying Party',
                'idv_provider'                       => 'IDV Provider',
                'kyb_provider'                       => 'KYB Provider',
                'system_integrator'                  => 'System Integrator',
                'consultancy'                        => 'Consultancy',
                'software_vendor'                    => 'Software Vendor',
                'business_registry'                  => 'Business Registry',
                'industry_association'               => 'Industry Association',
                'standards_development_organization' => 'Standards Development Organization (SDO)',
                'conformity_scheme_owner'            => 'Conformity Scheme Owner',
                'national_accreditation_body'        => 'National Accreditation Body (NAB)',
                'certification_body'                 => 'Certification Body (CB)',
                'conformity_assessment_body'         => 'Conformity Assessment Body (CAB)',
                'eudi_wallet_intermediary'           => 'EUDI Wallet Intermediary',
                'eidas_trust_service_provider'       => 'eIDAS Trust Service Provider',
                'trust_infrastructure_provider'      => 'Trust Infrastructure Provider',
            );
            $out = array();
            foreach (self::ECOSYSTEM_ROLE_CODES as $code) {
                $out[] = array(
                    'code'  => $code,
                    'label' => isset($labels[ $code ]) ? $labels[ $code ] : $code,
                );
            }
            return $out;
        }

        public static function diacc_component_options(): array {
            $labels = array(
                'digital_wallet'  => 'Digital Wallet',
                'verified_person' => 'Verified Person',
                'privacy'         => 'Privacy',
            );
            $out    = array();
            foreach (self::DIACC_COMPONENT_CODES as $code) {
                $out[] = array(
                    'code'  => $code,
                    'label' => isset($labels[ $code ]) ? $labels[ $code ] : $code,
                );
            }
            return $out;
        }

        /**
         * @param string $item_id org:slug.
         * @return string
         */
        public static function slug_from_item_id($item_id) {
            $item_id = (string) $item_id;
            if (strpos($item_id, 'org:') === 0) {
                return substr($item_id, 4);
            }
            return sanitize_title($item_id);
        }

        /**
         * Deep link for published-notification emails.
         *
         * @param string               $url          Current URL.
         * @param string               $catalog_type Catalog type slug.
         * @param string               $item_id      Organization id (org:…).
         * @param array<string, mixed> $payload      Published payload.
         * @return string
         */
        public static function filter_public_item_url($url, $catalog_type, $item_id, $payload) {
            unset($payload);
            if ($catalog_type !== self::TYPE) {
                return $url;
            }
            $item_id = trim((string) $item_id);
            if ($item_id === '' || ! class_exists('Fides_Organization_Catalog_SSR')) {
                return $url;
            }
            $path = trim((string) get_option(Fides_Organization_Catalog_SSR::OPTION_CATALOG_URL, ''));
            if ($path === '') {
                $path = Fides_Organization_Catalog_SSR::DEFAULT_CATALOG_PATH;
            }
            return add_query_arg('org', rawurlencode($item_id), home_url($path));
        }

        /**
         * @param array<string, mixed> $payload Raw request payload.
         * @param array<string, mixed> $context action, type, optional item_id.
         * @return array<string, mixed>|WP_Error Normalized payload; includes item_id when action=create.
         */
        public static function validate_payload(array $payload, array $context) {
            $action = isset($context['action']) ? sanitize_key((string) $context['action']) : 'create';

            $name = isset($payload['name']) ? sanitize_text_field((string) $payload['name']) : '';
            if ($name === '') {
                return new WP_Error('fides_org_invalid', __('Organization name is required.', 'fides-organization-catalog'));
            }

            $sectors = self::normalize_sectors($payload['sectors'] ?? array());
            if (count($sectors) > 1) {
                $sectors = array($sectors[0]);
            }
            if (empty($sectors)) {
                return new WP_Error('fides_org_invalid', __('Select a sector.', 'fides-organization-catalog'));
            }

            $country = self::normalize_country(isset($payload['country']) ? (string) $payload['country'] : '');
            if ($country === '') {
                return new WP_Error('fides_org_invalid', __('Country is required (ISO-3166-1 alpha-2 or EU).', 'fides-organization-catalog'));
            }

            if ($action === 'update') {
                $item_id = isset($context['item_id']) ? sanitize_text_field((string) $context['item_id']) : '';
                if ($item_id === '' || ! Fides_Catalog_Submission_Registry::is_valid_item_id(self::TYPE, $item_id)) {
                    return new WP_Error('fides_org_invalid', __('Invalid organization id.', 'fides-organization-catalog'));
                }
            } else {
                $slug_basis = isset($payload['slug']) ? sanitize_title((string) $payload['slug']) : sanitize_title($name);
                if ($slug_basis === '') {
                    $slug_basis = 'organization';
                }
                $item_id = 'org:' . $slug_basis;
            }

            $normalized = array(
                'item_id'     => $item_id,
                'name'        => $name,
                'sectors'     => $sectors,
                'country'     => $country,
                'legalName'   => self::optional_string($payload, 'legalName'),
                'description' => self::optional_text($payload, 'description'),
                'website'     => self::optional_url($payload, 'website'),
                'logo'        => self::optional_url($payload, 'logo'),
                'tags'        => self::normalize_tags($payload['tags'] ?? array()),
                'offerings'   => self::normalize_offerings($payload['offerings'] ?? array()),
            );

            $contact = self::normalize_contact($payload['contact'] ?? array());
            if ($action === 'update') {
                $merged_contact = self::merge_contact(
                    self::existing_contact_for_item($item_id),
                    $payload['contact'] ?? array()
                );
                if (! empty($merged_contact)) {
                    $normalized['contact'] = $merged_contact;
                }
            } elseif (! empty($contact)) {
                $normalized['contact'] = $contact;
            }

            if ($action === 'update') {
                $merged = self::merge_identifiers(
                    self::existing_identifiers_for_item($item_id),
                    $payload['identifiers'] ?? array()
                );
                if (! empty($merged)) {
                    $normalized['identifiers'] = $merged;
                }
            } else {
                $identifiers = self::normalize_identifiers($payload['identifiers'] ?? array());
                if (! empty($identifiers)) {
                    $normalized['identifiers'] = $identifiers;
                }
            }

            if ($action === 'update') {
                $merged_certs = self::merge_certifications(
                    self::existing_certifications_for_item($item_id),
                    $payload['certifications'] ?? array()
                );
            } else {
                $merged_certs = self::normalize_self_declared_certifications($payload['certifications'] ?? array());
            }
            if (! empty($merged_certs)) {
                $normalized['certifications'] = $merged_certs;
            }

            if (array_key_exists('fidesManifestoSupporter', $payload)) {
                $normalized['fidesManifestoSupporter'] = ! empty($payload['fidesManifestoSupporter']);
            }

            if (array_key_exists('ecosystemRoleCodes', $payload)) {
                $normalized['ecosystemRoleCodes'] = self::normalize_ecosystem_role_codes($payload['ecosystemRoleCodes']);
            }

            if (array_key_exists('media', $payload)) {
                $media = Fides_Organization_Catalog_Media_Normalizer::normalize_media($payload);
                if ($media !== array()) {
                    $normalized['media'] = $media;
                }
            }

            $media_check = Fides_Organization_Catalog_Media_Normalizer::validate_media_rules($normalized);
            if (is_wp_error($media_check)) {
                return $media_check;
            }

            if (class_exists('Fides_Catalog_Org_Tier')) {
                $existing = null;
                if ($action === 'update') {
                    $existing = Fides_Catalog_Org_Tier::existing_org_catalog_item($item_id);
                }
                $normalized = Fides_Catalog_Org_Tier::constrain_org_submission($normalized, $action, $existing);
            }

            return $normalized;
        }

        /**
         * @param array<string, mixed> $payload Normalized payload (without item_id key).
         * @return array<string, mixed>
         */
        public static function payload_to_export(array $payload) {
            if (isset($payload['item_id'])) {
                unset($payload['item_id']);
            }

            $item_id = isset($payload['id']) ? sanitize_text_field((string) $payload['id']) : '';
            if ($item_id === '' || ! Fides_Catalog_Submission_Registry::is_valid_item_id(self::TYPE, $item_id)) {
                $item_id = 'org:' . sanitize_title((string) ($payload['name'] ?? 'unknown'));
            }

            $organization = array(
                'id'      => $item_id !== '' ? $item_id : 'org:unknown',
                'name'    => (string) $payload['name'],
                'sectors' => $payload['sectors'],
            );

            foreach (array('legalName', 'description', 'website', 'logo', 'country', 'tags', 'offerings', 'contact', 'identifiers', 'certifications', 'ecosystemRoleCodes', 'media') as $key) {
                if (! empty($payload[ $key ])) {
                    $organization[ $key ] = $payload[ $key ];
                }
            }

            if (array_key_exists('fidesManifestoSupporter', $payload)) {
                $organization['fidesManifestoSupporter'] = ! empty($payload['fidesManifestoSupporter']);
            }

            if (class_exists('Fides_Catalog_Org_Tier')) {
                $organization = Fides_Catalog_Org_Tier::filter_org_export($organization, $item_id);
            }

            return array(
                '$schema'     => 'https://fides.community/schemas/organization-catalog/v1',
                'organization' => $organization,
                'lastUpdated' => gmdate(DATE_ATOM),
            );
        }

        /**
         * @param array<string, mixed> $item Aggregated organization item.
         * @return array<string, mixed>
         */
        public static function catalog_item_to_payload(array $item) {
            $payload = array(
                'id'          => isset($item['id']) ? (string) $item['id'] : '',
                'name'        => isset($item['name']) ? (string) $item['name'] : '',
                'sectors'     => isset($item['sectors']) && is_array($item['sectors']) ? array_values($item['sectors']) : array(),
                'country'     => isset($item['country']) ? (string) $item['country'] : '',
                'legalName'   => isset($item['legalName']) ? (string) $item['legalName'] : '',
                'description' => isset($item['description']) ? (string) $item['description'] : '',
                'website'     => isset($item['website']) ? (string) $item['website'] : '',
                'logo'        => isset($item['logoUri']) ? (string) $item['logoUri'] : (isset($item['logo']) ? (string) $item['logo'] : ''),
                'tags'        => isset($item['tags']) && is_array($item['tags']) ? $item['tags'] : array(),
                'offerings'   => isset($item['offerings']) && is_array($item['offerings']) ? $item['offerings'] : array(),
            );

            if (isset($item['contact']) && is_array($item['contact'])) {
                $payload['contact'] = $item['contact'];
            }
            if (isset($item['identifiers']) && is_array($item['identifiers'])) {
                $payload['identifiers'] = $item['identifiers'];
            }
            if (isset($item['certifications']) && is_array($item['certifications'])) {
                $payload['certifications'] = $item['certifications'];
            }
            if (array_key_exists('fidesManifestoSupporter', $item)) {
                $payload['fidesManifestoSupporter'] = (bool) $item['fidesManifestoSupporter'];
            }
            if (isset($item['declaredEcosystemRoleCodes']) && is_array($item['declaredEcosystemRoleCodes'])) {
                $payload['ecosystemRoleCodes'] = array_values($item['declaredEcosystemRoleCodes']);
            }
            if (isset($item['media']) && is_array($item['media'])) {
                $media = Fides_Organization_Catalog_Media_Normalizer::normalize_media($item);
                if ($media !== array()) {
                    $payload['media'] = $media;
                }
            }

            return $payload;
        }

        /**
         * @param mixed $raw Sectors from request.
         * @return string[]
         */
        private static function normalize_sectors($raw) {
            $values = is_array($raw) ? $raw : array($raw);
            $out    = array();
            foreach ($values as $value) {
                $code = sanitize_key(str_replace('-', '_', (string) $value));
                if (in_array($code, self::SECTOR_CODES, true) && ! in_array($code, $out, true)) {
                    $out[] = $code;
                }
            }
            return $out;
        }

        /**
         * @param mixed $raw Ecosystem role codes from request.
         * @return string[]
         */
        private static function normalize_ecosystem_role_codes($raw) {
            $values = is_array($raw) ? $raw : array($raw);
            $out    = array();
            foreach ($values as $value) {
                $code = sanitize_key(str_replace('-', '_', (string) $value));
                if (in_array($code, self::ECOSYSTEM_ROLE_CODES, true) && ! in_array($code, $out, true)) {
                    $out[] = $code;
                }
            }
            $ordered = array();
            foreach (self::ECOSYSTEM_ROLE_CODES as $code) {
                if (in_array($code, $out, true)) {
                    $ordered[] = $code;
                }
            }
            return $ordered;
        }

        /**
         * @param string $value Country code.
         * @return string
         */
        private static function normalize_country($value) {
            $value = strtoupper(trim($value));
            if ($value === 'EU') {
                return 'EU';
            }
            if (preg_match('/^[A-Z]{2}$/', $value)) {
                return $value;
            }
            return '';
        }

        /**
         * Unique offering labels for form autocomplete (seed list + published catalog).
         *
         * @return string[]
         */
        public static function offerings_suggestions_for_form(): array {
            static $cache = null;
            if ($cache !== null) {
                return $cache;
            }

            $unique = array();
            foreach (self::OFFERINGS_SEED_SUGGESTIONS as $label) {
                $label = self::normalize_offering_label($label);
                if ($label !== '') {
                    $unique[ strtolower($label) ] = $label;
                }
            }

            $path = plugin_dir_path(dirname(__FILE__)) . 'data/aggregated.json';
            if (is_readable($path)) {
                $json = json_decode((string) file_get_contents($path), true);
                $orgs = (is_array($json) && isset($json['organizations']) && is_array($json['organizations']))
                    ? $json['organizations']
                    : array();
                foreach ($orgs as $org) {
                    if (! is_array($org) || empty($org['offerings']) || ! is_array($org['offerings'])) {
                        continue;
                    }
                    foreach ($org['offerings'] as $offering) {
                        $label = self::normalize_offering_label((string) $offering);
                        if ($label !== '') {
                            $unique[ strtolower($label) ] = $label;
                        }
                    }
                }
            }

            $list = array_values($unique);
            natcasesort($list);
            $cache = array_values($list);
            return $cache;
        }

        /**
         * @param mixed $raw Tags.
         * @return string[]
         */
        private static function normalize_tags($raw) {
            if (! is_array($raw)) {
                $raw = explode(',', (string) $raw);
            }
            $out = array();
            foreach ($raw as $tag) {
                $tag = sanitize_text_field(trim((string) $tag));
                if ($tag !== '' && ! in_array($tag, $out, true)) {
                    $out[] = $tag;
                }
            }
            return $out;
        }

        /**
         * @param mixed $raw Offerings.
         * @return string[]
         */
        private static function normalize_offerings($raw) {
            if (! is_array($raw)) {
                $raw = explode(',', (string) $raw);
            }
            $out = array();
            foreach ($raw as $offering) {
                $label = self::normalize_offering_label((string) $offering);
                if ($label === '') {
                    continue;
                }
                if (in_array($label, $out, true)) {
                    continue;
                }
                $out[] = $label;
                if (count($out) >= self::OFFERINGS_MAX_ITEMS) {
                    break;
                }
            }
            return $out;
        }

        /**
         * @param string $value Raw offering label.
         * @return string
         */
        private static function normalize_offering_label($value) {
            $value = sanitize_text_field(trim((string) $value));
            if ($value === '') {
                return '';
            }
            if (function_exists('mb_strlen') && function_exists('mb_substr')) {
                if (mb_strlen($value) > self::OFFERING_MAX_LENGTH) {
                    $value = rtrim(mb_substr($value, 0, self::OFFERING_MAX_LENGTH));
                }
            } elseif (strlen($value) > self::OFFERING_MAX_LENGTH) {
                $value = rtrim(substr($value, 0, self::OFFERING_MAX_LENGTH));
            }
            return $value;
        }

        /**
         * @param mixed $raw Contact object.
         * @return array<string, string>
         */
        private static function normalize_contact($raw) {
            if (! is_array($raw)) {
                return array();
            }
            $out = array();
            if (! empty($raw['email'])) {
                $email = sanitize_email((string) $raw['email']);
                if ($email !== '' && is_email($email)) {
                    $out['email'] = $email;
                }
            }
            if (! empty($raw['contactUrl'])) {
                $legacy = self::email_from_legacy_contact_url((string) $raw['contactUrl']);
                if ($legacy !== '' && empty($out['email'])) {
                    $out['email'] = $legacy;
                }
            }
            if (! empty($raw['bookMeetingUrl'])) {
                $book_meeting_url = esc_url_raw((string) $raw['bookMeetingUrl']);
                if ($book_meeting_url !== '') {
                    $out['bookMeetingUrl'] = $book_meeting_url;
                }
            }
            return $out;
        }

        /**
         * @param string $value Legacy contactUrl (mailto: only).
         * @return string Sanitized email or empty.
         */
        private static function email_from_legacy_contact_url($value) {
            $value = trim((string) $value);
            if ($value === '' || stripos($value, 'mailto:') !== 0) {
                return '';
            }
            $email = sanitize_email(rawurldecode(substr($value, 7)));
            return ($email !== '' && is_email($email)) ? $email : '';
        }

        /**
         * Load contact already published for an organization (catalog JSON, then WP export).
         *
         * @param string $item_id org:slug.
         * @return array<string, string>
         */
        private static function existing_contact_for_item($item_id) {
            $item_id = sanitize_text_field($item_id);
            if ($item_id === '') {
                return array();
            }

            if (class_exists('Fides_Catalog_Submission_Lookups')) {
                $item = Fides_Catalog_Submission_Lookups::find_item_by_id(self::TYPE, $item_id);
                if (is_array($item) && isset($item['contact']) && is_array($item['contact'])) {
                    $from_catalog = self::normalize_contact($item['contact']);
                    if (! empty($from_catalog)) {
                        return $from_catalog;
                    }
                }
            }

            if (class_exists('Fides_Catalog_Submissions')) {
                $row = Fides_Catalog_Submissions::get_latest_for_item(self::TYPE, $item_id, 'published');
                if (is_array($row)
                    && isset($row['payload']['contact'])
                    && is_array($row['payload']['contact'])) {
                    return self::normalize_contact($row['payload']['contact']);
                }
            }

            return array();
        }

        /**
         * Merge catalog contact with submitted values (submitted keys win).
         *
         * @param array<string, mixed> $base    Existing contact.
         * @param array<string, mixed> $overlay Submitted contact.
         * @return array<string, string>
         */
        private static function merge_contact($base, $overlay) {
            return array_merge(
                self::normalize_contact($base),
                self::normalize_contact($overlay)
            );
        }

        /**
         * Load identifiers already published for an organization (catalog JSON, then WP export).
         *
         * @param string $item_id org:slug.
         * @return array<string, string>
         */
        private static function existing_identifiers_for_item($item_id) {
            $item_id = sanitize_text_field($item_id);
            if ($item_id === '') {
                return array();
            }

            if (class_exists('Fides_Catalog_Submission_Lookups')) {
                $item = Fides_Catalog_Submission_Lookups::find_item_by_id(self::TYPE, $item_id);
                if (is_array($item) && isset($item['identifiers']) && is_array($item['identifiers'])) {
                    $from_catalog = self::normalize_identifiers($item['identifiers']);
                    if (! empty($from_catalog)) {
                        return $from_catalog;
                    }
                }
            }

            if (class_exists('Fides_Catalog_Submissions')) {
                $row = Fides_Catalog_Submissions::get_latest_for_item(self::TYPE, $item_id, 'published');
                if (is_array($row)
                    && isset($row['payload']['identifiers'])
                    && is_array($row['payload']['identifiers'])) {
                    return self::normalize_identifiers($row['payload']['identifiers']);
                }
            }

            return array();
        }

        /**
         * Merge catalog identifiers with submitted values (submitted keys win).
         *
         * @param array<string, mixed> $base    Existing identifiers.
         * @param array<string, mixed> $overlay Submitted identifiers.
         * @return array<string, string>
         */
        private static function merge_identifiers($base, $overlay) {
            return array_merge(
                self::normalize_identifiers($base),
                self::normalize_identifiers($overlay)
            );
        }

        /**
         * @param mixed $raw Certifications from request.
         * @return array<int, array{code: string, evidence?: array<string, mixed>}>
         */
        private static function normalize_self_declared_certifications($raw) {
            if (! is_array($raw)) {
                return array();
            }

            $out = array();
            foreach ($raw as $entry) {
                $code = '';
                $evidence = null;
                if (is_string($entry)) {
                    $code = sanitize_key($entry);
                } elseif (is_array($entry) && ! empty($entry['code'])) {
                    $code = sanitize_key((string) $entry['code']);
                    if (isset($entry['evidence']) && is_array($entry['evidence'])) {
                        $evidence = self::normalize_certification_evidence($entry['evidence']);
                    }
                }
                if ($code === '' || ! in_array($code, self::SELF_DECLARED_CERT_CODES, true)) {
                    continue;
                }
                foreach ($out as $existing) {
                    if ($existing['code'] === $code) {
                        continue 2;
                    }
                }
                $cert = array('code' => $code);
                if ($code === 'diacc') {
                    $components = array();
                    if (is_array($entry) && isset($entry['details']) && is_array($entry['details'])) {
                        $components = self::normalize_diacc_components($entry['details']['components'] ?? array());
                    }
                    if (empty($components)) {
                        continue;
                    }
                    $cert['details'] = array('components' => $components);
                }
                if (! empty($evidence)) {
                    $cert['evidence'] = $evidence;
                }
                $out[] = $cert;
            }

            return $out;
        }

        /**
         * @param mixed $raw DIACC component rows.
         * @return array<int, array{component: string, loa?: string, evidence?: array<string, mixed>}>
         */
        private static function normalize_diacc_components($raw) {
            if (! is_array($raw)) {
                return array();
            }
            $out = array();
            foreach ($raw as $row) {
                if (! is_array($row) || empty($row['component'])) {
                    continue;
                }
                $component = sanitize_key(str_replace('-', '_', (string) $row['component']));
                if (! in_array($component, self::DIACC_COMPONENT_CODES, true)) {
                    continue;
                }
                foreach ($out as $existing) {
                    if ($existing['component'] === $component) {
                        continue 2;
                    }
                }
                $item = array('component' => $component);
                if (! empty($row['loa'])) {
                    $loa = sanitize_text_field((string) $row['loa']);
                    if ($loa !== '') {
                        $item['loa'] = $loa;
                    }
                }
                if (isset($row['evidence']) && is_array($row['evidence'])) {
                    $evidence = self::normalize_certification_evidence($row['evidence']);
                    if (! empty($evidence)) {
                        $item['evidence'] = $evidence;
                    }
                }
                $out[] = $item;
            }
            return $out;
        }

        /**
         * @param array<string, mixed> $raw Evidence object.
         * @return array<string, mixed>
         */
        private static function normalize_certification_evidence(array $raw) {
            $kind = isset($raw['kind']) ? sanitize_key((string) $raw['kind']) : '';
            if ($kind === 'url' && ! empty($raw['url'])) {
                $url = esc_url_raw((string) $raw['url']);
                if ($url === '') {
                    return array();
                }
                $evidence = array(
                    'kind' => 'url',
                    'url'  => $url,
                );
                if (! empty($raw['label'])) {
                    $label = sanitize_text_field((string) $raw['label']);
                    if ($label !== '') {
                        $evidence['label'] = $label;
                    }
                }
                return $evidence;
            }
            return array();
        }

        /**
         * Load certifications already published for an organization.
         *
         * @param string $item_id org:slug.
         * @return array<int, array<string, mixed>>
         */
        private static function existing_certifications_for_item($item_id) {
            $item_id = sanitize_text_field($item_id);
            if ($item_id === '') {
                return array();
            }

            if (class_exists('Fides_Catalog_Submission_Lookups')) {
                $item = Fides_Catalog_Submission_Lookups::find_item_by_id(self::TYPE, $item_id);
                if (is_array($item) && isset($item['certifications']) && is_array($item['certifications'])) {
                    return $item['certifications'];
                }
            }

            if (class_exists('Fides_Catalog_Submissions')) {
                $row = Fides_Catalog_Submissions::get_latest_for_item(self::TYPE, $item_id, 'published');
                if (is_array($row)
                    && isset($row['payload']['certifications'])
                    && is_array($row['payload']['certifications'])) {
                    return $row['payload']['certifications'];
                }
            }

            return array();
        }

        /**
         * Merge preserved QTSP certifications with self-declared form selections.
         *
         * @param array<int, mixed> $existing Existing certification entries.
         * @param mixed             $from_form Submitted certifications.
         * @return array<int, array<string, mixed>>
         */
        private static function merge_certifications($existing, $from_form) {
            $existing       = is_array($existing) ? $existing : array();
            $preserved      = array();
            $existing_by_code = array();

            foreach ($existing as $cert) {
                if (! is_array($cert) || empty($cert['code'])) {
                    continue;
                }
                $code = sanitize_key((string) $cert['code']);
                $existing_by_code[ $code ] = $cert;
                if (in_array($code, self::PRESERVED_CERT_CODES, true)) {
                    $preserved[] = $cert;
                }
            }

            $self = array();
            foreach (self::normalize_self_declared_certifications($from_form) as $cert) {
                $code = (string) $cert['code'];
                if ($code === 'diacc'
                    && isset($existing_by_code['diacc']['details'])
                    && is_array($existing_by_code['diacc']['details'])
                    && empty($cert['details'])) {
                    $cert['details'] = $existing_by_code['diacc']['details'];
                }
                $self[] = $cert;
            }

            return array_merge($preserved, $self);
        }

        /**
         * @param mixed $raw Identifiers object.
         * @return array<string, string>
         */
        private static function normalize_identifiers($raw) {
            if (! is_array($raw)) {
                return array();
            }
            $allowed = array('business_registration_number', 'vat_number', 'lei', 'eori', 'euid', 'duns', 'gln', 'did');
            $out     = array();
            foreach ($allowed as $key) {
                if (empty($raw[ $key ])) {
                    continue;
                }
                $value = sanitize_text_field((string) $raw[ $key ]);
                if ($value === '') {
                    continue;
                }
                if ($key === 'did' && stripos($value, 'did:') !== 0) {
                    continue;
                }
                $out[ $key ] = $value;
            }
            return $out;
        }

        /**
         * @param array<string, mixed> $payload Payload.
         * @param string               $key     Field key.
         * @return string
         */
        private static function optional_string(array $payload, $key) {
            return isset($payload[ $key ]) ? sanitize_text_field((string) $payload[ $key ]) : '';
        }

        /**
         * @param array<string, mixed> $payload Payload.
         * @param string               $key     Field key.
         * @return string
         */
        private static function optional_text(array $payload, $key) {
            return isset($payload[ $key ]) ? trim(wp_kses_post((string) $payload[ $key ])) : '';
        }

        /**
         * @param array<string, mixed> $payload Payload.
         * @param string               $key     Field key.
         * @return string
         */
        private static function optional_url(array $payload, $key) {
            return isset($payload[ $key ]) ? esc_url_raw((string) $payload[ $key ]) : '';
        }
    }
}
