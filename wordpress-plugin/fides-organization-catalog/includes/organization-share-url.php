<?php
/**
 * Share-URL helpers. LinkedIn crawlers ignore ?org= on the listing page,
 * so listing query URLs 301 to /organization/{id}/. Update/submit forms also
 * use ?org= and must never be redirected.
 *
 * Listing detection is an exact path match (not a prefix). Nested or sibling
 * form paths such as /organizations/update-organization/ must stay unmatched.
 *
 * @package fides-organization-catalog
 */

if (! defined('ABSPATH')) {
    exit;
}

/**
 * @return array<int, string>
 */
function fides_org_catalog_default_listing_path_aliases(): array {
    return array(
        '/organizations/',
        '/ecosystem-explorer/organization-catalog/',
    );
}

function fides_org_catalog_normalize_path($path): string {
    if (! is_string($path) || $path === '') {
        return '';
    }
    $path = '/' . ltrim($path, '/');
    if ($path !== '/') {
        $path = rtrim($path, '/') . '/';
    }
    return $path;
}

/**
 * True only when $path is exactly one of the listing aliases.
 *
 * @param mixed             $path    Request path (query string already stripped).
 * @param array<int, mixed> $aliases Listing path aliases.
 */
function fides_org_catalog_path_is_exact_listing($path, array $aliases): bool {
    $normalized = fides_org_catalog_normalize_path(is_string($path) ? $path : '');
    if ($normalized === '' || $normalized === '/') {
        return false;
    }
    foreach ($aliases as $alias) {
        if (! is_string($alias) || $alias === '') {
            continue;
        }
        if ($normalized === fides_org_catalog_normalize_path($alias)) {
            return true;
        }
    }
    return false;
}

function fides_org_catalog_share_path(): string {
    $path = '/organization/';
    if (function_exists('apply_filters')) {
        $path = (string) apply_filters('fides_org_catalog_share_path', $path);
    }
    $normalized = fides_org_catalog_normalize_path($path);
    return $normalized !== '' ? $normalized : '/organization/';
}

function fides_org_catalog_listing_path(): string {
    $default = '/organizations/';
    if (function_exists('get_option')) {
        $opt = trim((string) get_option('fides_org_catalog_page_url', ''));
        if ($opt !== '') {
            $default = $opt;
        }
    }
    if (function_exists('apply_filters')) {
        $default = (string) apply_filters('fides_org_catalog_path', $default);
    }
    $normalized = fides_org_catalog_normalize_path($default);
    return $normalized !== '' ? $normalized : '/organizations/';
}

function fides_org_catalog_is_listing_request_path($path): bool {
    $aliases = fides_org_catalog_default_listing_path_aliases();
    array_unshift($aliases, fides_org_catalog_listing_path());
    return fides_org_catalog_path_is_exact_listing($path, $aliases);
}
