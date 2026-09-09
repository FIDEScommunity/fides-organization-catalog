<?php
/**
 * Regression tests for organization share-URL listing detection.
 *
 * Run from the repo root:
 *   php tests/php/run.php
 */

declare(strict_types=1);

if (! defined('ABSPATH')) {
    define('ABSPATH', __DIR__ . '/');
}

$plugin = dirname(__DIR__, 2) . '/wordpress-plugin/fides-organization-catalog';
require $plugin . '/includes/organization-share-url.php';

$failures = 0;
$passes = 0;

function expect_same($actual, $expected, string $label): void {
    global $failures, $passes;
    if ($actual !== $expected) {
        $failures++;
        fwrite(STDERR, "FAIL {$label}\n  expected: " . var_export($expected, true) . "\n  actual:   " . var_export($actual, true) . "\n");
        return;
    }
    $passes++;
    echo "ok {$label}\n";
}

$aliases = array_merge(
    array('/organizations/'),
    fides_org_catalog_default_listing_path_aliases()
);

$listing_paths = array(
    '/organizations/',
    '/organizations',
    '/ecosystem-explorer/organization-catalog/',
    '/ecosystem-explorer/organization-catalog',
);

foreach ($listing_paths as $path) {
    expect_same(
        fides_org_catalog_path_is_exact_listing($path, $aliases),
        true,
        "listing path redirects: {$path}"
    );
}

$form_paths = array(
    '/organizations-update/',
    '/organizations-update',
    '/organizations-submit/',
    '/organizations-submit',
    '/organizations/submit-organization/',
    '/organizations/submit-organization',
    '/organizations/update-organization/',
    '/organizations/update-organization',
    '/organization/org%3Aayanworks/',
    '/organization/org:ayanworks/',
    '/',
    '',
);

foreach ($form_paths as $path) {
    expect_same(
        fides_org_catalog_path_is_exact_listing($path, $aliases),
        false,
        "non-listing path must not redirect: {$path}"
    );
}

expect_same(
    fides_org_catalog_is_listing_request_path('/organizations/'),
    true,
    'default aliases treat /organizations/ as listing without WP'
);
expect_same(
    fides_org_catalog_is_listing_request_path('/organizations/update-organization/'),
    false,
    'nested update form must not count as listing'
);
expect_same(
    fides_org_catalog_is_listing_request_path('/organizations/submit-organization/'),
    false,
    'nested submit form must not count as listing'
);
expect_same(
    fides_org_catalog_is_listing_request_path('/ecosystem-explorer/organization-catalog/'),
    true,
    'legacy listing path is an exact listing match'
);
expect_same(
    fides_org_catalog_share_path(),
    '/organization/',
    'share path is singular /organization/'
);

$encoded = rawurlencode('org:ayanworks');
expect_same($encoded, 'org%3Aayanworks', 'org ids with colon stay encoded, not lowercased');
expect_same(rawurldecode($encoded), 'org:ayanworks', 'encoded org id round-trips with original case');

echo "\n{$passes} passed, {$failures} failed\n";
exit($failures === 0 ? 0 : 1);
