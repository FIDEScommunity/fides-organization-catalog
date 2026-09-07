<?php
/**
 * Organization catalog recognition normalization (submission + prefill).
 *
 * @package fides-organization-catalog
 */

if (! defined('ABSPATH')) {
    exit;
}

if (! class_exists('Fides_Organization_Catalog_Recognitions_Normalizer')) {

    class Fides_Organization_Catalog_Recognitions_Normalizer {

        const LIMIT_CUSTOMER_STORIES = 5;
        const LIMIT_AWARDS_AND_RECOGNITIONS = 10;
        const LIMIT_RECOGNITION_TITLE = 100;

        /**
         * @return array<string, int>
         */
        public static function limits_for_form() {
            return array(
                'customerStories'       => self::LIMIT_CUSTOMER_STORIES,
                'awardsAndRecognitions' => self::LIMIT_AWARDS_AND_RECOGNITIONS,
                'recognitionTitle'      => self::LIMIT_RECOGNITION_TITLE,
            );
        }

        /**
         * @param array<string, mixed> $payload Organization fields.
         * @return array{customerStories?: array<int, array<string, string>>, awardsAndRecognitions?: array<int, array<string, string>>}
         */
        public static function normalize_recognitions(array $payload) {
            if (! isset($payload['recognitions']) || ! is_array($payload['recognitions'])) {
                return array();
            }

            $raw = $payload['recognitions'];
            $recognitions = array();
            $customer_stories = self::normalize_items(
                $raw['customerStories'] ?? array(),
                self::LIMIT_CUSTOMER_STORIES
            );
            $awards = self::normalize_items(
                $raw['awardsAndRecognitions'] ?? array(),
                self::LIMIT_AWARDS_AND_RECOGNITIONS
            );

            if ($customer_stories !== array()) {
                $recognitions['customerStories'] = $customer_stories;
            }
            if ($awards !== array()) {
                $recognitions['awardsAndRecognitions'] = $awards;
            }

            return $recognitions;
        }

        /**
         * @param mixed $raw Recognition rows.
         * @param int   $limit Maximum number of rows.
         * @return array<int, array<string, string>>
         */
        private static function normalize_items($raw, $limit) {
            if (! is_array($raw)) {
                return array();
            }

            $items = array();
            foreach ($raw as $entry) {
                if (! is_array($entry)) {
                    continue;
                }
                $title = isset($entry['title'])
                    ? sanitize_text_field(trim((string) $entry['title']))
                    : '';
                $title = self::truncate($title, self::LIMIT_RECOGNITION_TITLE);
                if ($title === '') {
                    continue;
                }

                $item = array('title' => $title);
                if (! empty($entry['url'])) {
                    $url = esc_url_raw(trim((string) $entry['url']));
                    if ($url !== '') {
                        $item['url'] = $url;
                    }
                }
                $items[] = $item;
                if (count($items) >= $limit) {
                    break;
                }
            }

            return $items;
        }

        /**
         * @param string $value Raw title.
         * @param int    $limit Maximum character length.
         */
        private static function truncate($value, $limit) {
            if (function_exists('mb_substr')) {
                return mb_substr($value, 0, $limit);
            }
            return substr($value, 0, $limit);
        }
    }
}
