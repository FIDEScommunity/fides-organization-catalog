<?php
/**
 * Organization catalog media normalization (submission + prefill).
 *
 * @package fides-organization-catalog
 */

if (! defined('ABSPATH')) {
    exit;
}

if (! class_exists('Fides_Organization_Catalog_Media_Normalizer')) {

    class Fides_Organization_Catalog_Media_Normalizer {

        const LIMIT_MEDIA_VIDEOS = 3;
        const LIMIT_MEDIA_IMAGES = 10;

        /**
         * @return array<string, int>
         */
        public static function limits_for_form() {
            return array(
                'mediaVideos' => self::LIMIT_MEDIA_VIDEOS,
                'mediaImages' => self::LIMIT_MEDIA_IMAGES,
            );
        }

        /**
         * @param array<string, mixed> $payload Organization fields.
         * @return array{videos?: string[], images?: string[]}
         */
        public static function normalize_media(array $payload) {
            $videos = array();
            $images = array();

            if (isset($payload['media']) && is_array($payload['media'])) {
                foreach (array('videos', 'images') as $key) {
                    if (! isset($payload['media'][ $key ]) || ! is_array($payload['media'][ $key ])) {
                        continue;
                    }
                    foreach ($payload['media'][ $key ] as $url) {
                        $clean = esc_url_raw(trim((string) $url));
                        if ($clean === '') {
                            continue;
                        }
                        if ($key === 'videos' && ! in_array($clean, $videos, true)) {
                            $videos[] = $clean;
                        }
                        if ($key === 'images' && ! in_array($clean, $images, true)) {
                            $images[] = $clean;
                        }
                    }
                }
            }

            $media = array();
            if ($videos !== array()) {
                $media['videos'] = array_slice($videos, 0, self::LIMIT_MEDIA_VIDEOS);
            }
            if ($images !== array()) {
                $media['images'] = array_slice($images, 0, self::LIMIT_MEDIA_IMAGES);
            }

            return $media;
        }

        /**
         * @param array<string, mixed> $payload Normalized organization submission payload.
         * @return true|WP_Error
         */
        public static function validate_media_rules(array $payload) {
            if (! isset($payload['media']) || ! is_array($payload['media'])) {
                return true;
            }

            $videos = isset($payload['media']['videos']) && is_array($payload['media']['videos'])
                ? $payload['media']['videos']
                : array();
            $images = isset($payload['media']['images']) && is_array($payload['media']['images'])
                ? $payload['media']['images']
                : array();

            if ($videos === array() && $images === array()) {
                return new WP_Error(
                    'fides_org_invalid',
                    __('Media must include at least one video or image URL.', 'fides-organization-catalog')
                );
            }

            if (count($videos) > self::LIMIT_MEDIA_VIDEOS || count($images) > self::LIMIT_MEDIA_IMAGES) {
                return new WP_Error(
                    'fides_org_invalid',
                    __('Too many media items (check video and image limits).', 'fides-organization-catalog')
                );
            }

            return true;
        }
    }
}
