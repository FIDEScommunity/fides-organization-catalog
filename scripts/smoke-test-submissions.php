<?php
/**
 * CLI smoke test for organization catalog submissions (fase 2).
 * Run: php scripts/smoke-test-submissions.php
 */

declare(strict_types=1);

$socket = '/Users/victorvanderhulst/Library/Application Support/Local/run/buO_mZaLl/mysql/mysqld.sock';
$wp_root = '/Users/victorvanderhulst/Local Sites/utrecht-demo/app/public';

if (! is_readable($wp_root . '/wp-load.php')) {
    fwrite(STDERR, "WP root not found: {$wp_root}\n");
    exit(1);
}
if (! is_readable($socket)) {
    fwrite(STDERR, "MySQL socket not found (is Local running?): {$socket}\n");
    exit(1);
}

$_SERVER['HTTP_HOST']   = 'utrecht-demo.local';
$_SERVER['REQUEST_URI'] = '/';
define('DB_HOST', 'localhost:' . $socket);

require $wp_root . '/wp-load.php';

$results = array();
$failures = 0;

function smoke(string $name, callable $fn): void {
    global $results, $failures;
    try {
        $detail = $fn();
        $results[] = array('name' => $name, 'ok' => true, 'detail' => $detail);
        echo "PASS  {$name}" . ($detail !== '' ? " — {$detail}" : '') . "\n";
    } catch (Throwable $e) {
        $failures++;
        $msg = $e->getMessage();
        $results[] = array('name' => $name, 'ok' => false, 'detail' => $msg);
        echo "FAIL  {$name} — {$msg}\n";
    }
}

function assert_true(bool $cond, string $msg): void {
    if (! $cond) {
        throw new RuntimeException($msg);
    }
}

function rest_response_data($response): array {
    if ($response instanceof WP_Error) {
        throw new RuntimeException($response->get_error_message());
    }
    $data = rest_get_server()->response_to_data($response, false);
    return is_array($data) ? $data : array();
}

smoke('Core classes loaded', static function (): string {
    assert_true(class_exists('Fides_Catalog_Submission_REST'), 'REST class missing');
    assert_true(class_exists('Fides_Organization_Catalog_Submission_Adapter'), 'Org adapter missing');
    assert_true(Fides_Catalog_Submission_Registry::exists('organization'), 'Organization type not registered');
    return 'registry ok';
});

smoke('Existing published submission in DB', static function (): string {
    $row = Fides_Catalog_Submissions::get_by_id(1);
    assert_true(is_array($row), 'Submission #1 missing');
    assert_true(($row['status'] ?? '') === 'published', 'Expected published status');
    assert_true(($row['item_id'] ?? '') === 'org:profound-it', 'Unexpected item_id');
    return (string) $row['item_id'];
});

smoke('Lookup GitHub org (fides)', static function (): string {
    wp_set_current_user(1);
    $request = new WP_REST_Request('GET', '/fides-catalog/v1/lookups/organization');
    $request->set_param('type', 'organization');
    $request->set_param('q', 'fides');
    $response = Fides_Catalog_Submission_REST::handle_lookup($request);
    $data     = rest_response_data($response);
    $items    = isset($data['content']) && is_array($data['content']) ? $data['content'] : array();
    assert_true(count($items) > 0, 'No lookup hits for fides');
    $ids = array_map(static fn ($i) => (string) ($i['id'] ?? ''), $items);
    assert_true(in_array('org:fides', $ids, true), 'org:fides not in lookup results');
    return count($items) . ' hits, includes org:fides';
});

smoke('WP-only published org absent from lookup (known gap)', static function (): string {
    wp_set_current_user(1);
    $request = new WP_REST_Request('GET', '/fides-catalog/v1/lookups/organization');
    $request->set_param('type', 'organization');
    $request->set_param('q', 'profound');
    $response = Fides_Catalog_Submission_REST::handle_lookup($request);
    $data     = rest_response_data($response);
    $items    = isset($data['content']) && is_array($data['content']) ? $data['content'] : array();
    foreach ($items as $item) {
        if (($item['id'] ?? '') === 'org:profound-it') {
            throw new RuntimeException('org:profound-it unexpectedly found in lookup');
        }
    }
    return 'org:profound-it not in lookup (expected until merge/fase 3)';
});

smoke('Prefill GitHub org payload', static function (): string {
    wp_set_current_user(1);
    $request = new WP_REST_Request('GET', '/fides-catalog/v1/submissions/organization/item/org:fides');
    $request->set_param('type', 'organization');
    $request->set_param('item_id', 'org:fides');
    $response = Fides_Catalog_Submission_REST::handle_get_item_payload($request);
    $data     = rest_response_data($response);
    $payload  = isset($data['payload']) && is_array($data['payload']) ? $data['payload'] : array();
    assert_true(($payload['name'] ?? '') !== '', 'Prefill name empty');
    return (string) ($payload['name'] ?? '');
});

smoke('Create submission (smoke test org)', static function (): string {
    wp_set_current_user(1);
    $suffix = gmdate('His');
    $payload = array(
        'name'        => 'Smoke Test Org ' . $suffix,
        'sectors'     => array('digital'),
        'country'     => 'NL',
        'description' => 'Automated fase 2 smoke test entry.',
        'website'     => 'https://example.com',
        'identifiers' => array('did' => 'did:web:smoke.example.com'),
    );
    $request = new WP_REST_Request('POST', '/fides-catalog/v1/submissions/organization');
    $request->set_param('type', 'organization');
    $request->set_body(wp_json_encode($payload));
    $request->set_header('Content-Type', 'application/json');
    $response = Fides_Catalog_Submission_REST::handle_create($request);
    $data     = rest_response_data($response);
    assert_true(($data['status'] ?? '') === 'received', 'Create status not received');
    $item_id = (string) ($data['itemId'] ?? '');
    assert_true(str_starts_with($item_id, 'org:'), 'Invalid created item id');
    $GLOBALS['smoke_create_id'] = (int) ($data['id'] ?? 0);
    $GLOBALS['smoke_create_item'] = $item_id;
    return $item_id . ' #' . (int) ($data['id'] ?? 0);
});

smoke('Update proposal for GitHub org', static function (): string {
    wp_set_current_user(1);
    $payload = array(
        'name'        => 'FIDES Community',
        'sectors'     => array('digital'),
        'country'     => 'NL',
        'description' => 'Smoke test update proposal — revert on moderation.',
    );
    $request = new WP_REST_Request('POST', '/fides-catalog/v1/submissions/organization/org:fides');
    $request->set_param('type', 'organization');
    $request->set_param('item_id', 'org:fides');
    $request->set_body(wp_json_encode($payload));
    $request->set_header('Content-Type', 'application/json');
    $response = Fides_Catalog_Submission_REST::handle_update($request);
    $data     = rest_response_data($response);
    assert_true(($data['status'] ?? '') === 'received', 'Update status not received');
    assert_true(($data['action'] ?? '') === 'update', 'Action not update');
    $GLOBALS['smoke_update_id'] = (int) ($data['id'] ?? 0);
    return 'submission #' . (int) ($data['id'] ?? 0);
});

smoke('Export includes published org:profound-it', static function (): string {
    $request = new WP_REST_Request('GET', '/fides-catalog/v1/export/organization');
    $request->set_param('type', 'organization');
    $response = Fides_Catalog_Submission_REST::handle_export($request);
    $data     = rest_response_data($response);
    $entries  = isset($data['entries']) && is_array($data['entries']) ? $data['entries'] : array();
    $ids      = array_map(static fn ($e) => (string) ($e['itemId'] ?? ''), $entries);
    assert_true(in_array('org:profound-it', $ids, true), 'Published org missing from export');
    return count($entries) . ' export entries';
});

smoke('Update merge: form-style payload keeps catalog identifiers', static function (): string {
    $payload = array(
        'name'        => 'Gaia-X AISBL',
        'sectors'     => array('digital'),
        'country'     => 'BE',
        'description' => 'Smoke test update with DID only in request body.',
        'identifiers' => array('did' => 'did:web:gaia-x.eu'),
    );
    $normalized = Fides_Organization_Catalog_Submission_Adapter::validate_payload(
        $payload,
        array(
            'action'  => 'update',
            'type'    => 'organization',
            'item_id' => 'org:gaia-x',
        )
    );
    if ($normalized instanceof WP_Error) {
        throw new RuntimeException($normalized->get_error_message());
    }
    $idents = isset($normalized['identifiers']) && is_array($normalized['identifiers']) ? $normalized['identifiers'] : array();
    assert_true(isset($idents['business_registration_number'], $idents['vat_number'], $idents['did']), 'Merged identifiers incomplete');
    assert_true($idents['did'] === 'did:web:gaia-x.eu', 'Submitted DID not applied');
    return 'vat + trade register preserved, DID updated';
});

smoke('Update merge: empty identifiers in payload keeps catalog identifiers', static function (): string {
    $payload = array(
        'name'    => 'Gaia-X AISBL',
        'sectors' => array('digital'),
        'country' => 'BE',
    );
    $normalized = Fides_Organization_Catalog_Submission_Adapter::validate_payload(
        $payload,
        array(
            'action'  => 'update',
            'type'    => 'organization',
            'item_id' => 'org:gaia-x',
        )
    );
    if ($normalized instanceof WP_Error) {
        throw new RuntimeException($normalized->get_error_message());
    }
    $idents = isset($normalized['identifiers']) && is_array($normalized['identifiers']) ? $normalized['identifiers'] : array();
    assert_true(isset($idents['business_registration_number'], $idents['vat_number']), 'Catalog identifiers dropped without merge');
    assert_true(! isset($idents['did']), 'Unexpected DID added');
    return 'catalog identifiers preserved when form sends none';
});

smoke('Official claim stays in WordPress payload and out of export', static function (): string {
    $normalized = Fides_Organization_Catalog_Submission_Adapter::validate_payload(
        array(
            'name'                   => 'Gaia-X AISBL',
            'sectors'                => array('digital'),
            'country'                => 'BE',
            'requestOfficialClaim'   => true,
        ),
        array(
            'action'  => 'update',
            'type'    => 'organization',
            'item_id' => 'org:gaia-x',
        )
    );
    if ($normalized instanceof WP_Error) {
        throw new RuntimeException($normalized->get_error_message());
    }
    assert_true(! empty($normalized['requestOfficialClaim']), 'Claim signal missing from normalized submission');

    $export = Fides_Organization_Catalog_Submission_Adapter::payload_to_export($normalized);
    $organization = isset($export['organization']) && is_array($export['organization'])
        ? $export['organization']
        : array();
    assert_true(! array_key_exists('requestOfficialClaim', $organization), 'Claim signal leaked into catalog export');
    $diff_payload = Fides_Organization_Catalog_Submission_Adapter::prepare_payload_for_diff($normalized);
    assert_true(! array_key_exists('requestOfficialClaim', $diff_payload), 'Claim signal leaked into catalog diff');
    return 'claim retained for review only';
});

smoke('Identifiers: adapter accepts full set via REST', static function (): string {
    $payload = array(
        'name'        => 'Identifier Test',
        'sectors'     => array('digital'),
        'country'     => 'NL',
        'identifiers' => array(
            'lei'                          => '5493000IBP32UQZ0KL24',
            'vat_number'                   => 'NL123456789B01',
            'business_registration_number' => '12345678',
            'did'                          => 'did:web:example.com',
        ),
    );
    $normalized = Fides_Organization_Catalog_Submission_Adapter::validate_payload($payload, array('action' => 'create'));
    if ($normalized instanceof WP_Error) {
        throw new RuntimeException($normalized->get_error_message());
    }
    $idents = isset($normalized['identifiers']) && is_array($normalized['identifiers']) ? $normalized['identifiers'] : array();
    assert_true(isset($idents['lei'], $idents['vat_number'], $idents['did']), 'Normalized identifiers incomplete');
    return 'lei, vat_number, did stored in payload';
});

smoke('Certifications: self-declared merge keeps QTSP from catalog', static function (): string {
    $existing = array(
        array('code' => 'qtsp', 'details' => array('trustServices' => array(array('code' => 'Q_TIMESTAMP')))),
        array('code' => 'iso27001'),
    );
    $merged = (new ReflectionClass(Fides_Organization_Catalog_Submission_Adapter::class))
        ->getMethod('merge_certifications');
    $merged->setAccessible(true);
    $result = $merged->invoke(null, $existing, array(array(
        'code'     => 'diacc',
        'details'  => array(
            'components' => array(
                array('component' => 'verified_person'),
            ),
        ),
        'evidence' => array('kind' => 'url', 'url' => 'https://example.test/proof.pdf'),
    )));
    assert_true(is_array($result), 'Merged certifications not array');
    $codes = array_map(static function ($cert) {
        return is_array($cert) ? (string) ($cert['code'] ?? '') : '';
    }, $result);
    assert_true(in_array('qtsp', $codes, true), 'QTSP certification dropped on merge');
    assert_true(in_array('diacc', $codes, true), 'DIACC certification missing after merge');
    assert_true(! in_array('iso27001', $codes, true), 'Unchecked self-declared certification should be removed');
    return 'QTSP preserved; self-declared selections replaced';
});

smoke('Certifications: form uses accordions and inline proof URLs', static function (): string {
    $js = file_get_contents(dirname(__DIR__) . '/wordpress-plugin/fides-organization-catalog/assets/organization-form.js');
    assert_true(is_string($js), 'organization-form.js unreadable');
    assert_true(strpos($js, 'fides-org-optional-sections') !== false, 'Optional accordion sections wrapper missing');
    assert_true(strpos($js, 'fides-org-diacc-component-row') !== false, 'DIACC per-component proof rows missing');
    assert_true(strpos($js, 'diacc-components') !== false, 'DIACC component checkboxes missing');
    return 'UI: optional accordions, inline proof URLs, DIACC per-component proof';
});

smoke('Identifiers: form exposes schema identifier fields', static function (): string {
    $js = file_get_contents(dirname(__DIR__) . '/wordpress-plugin/fides-organization-catalog/assets/organization-form.js');
    assert_true(is_string($js), 'organization-form.js unreadable');
    assert_true(strpos($js, 'fides-org-id-lei') !== false, 'LEI field missing in form JS');
    assert_true(strpos($js, 'business_registration_number') !== false, 'Business registration field missing in form JS');
    assert_true(strpos($js, 'fides-org-contact-url') !== false, 'Contact URL field missing in form JS');
    assert_true(strpos($js, 'fides-org-book-meeting-url') !== false, 'Book a meeting URL field missing in form JS');
    return 'UI: full identifiers block + support URL';
});

smoke('Grant ownership to submitter (user 1 on org:profound-it)', static function (): string {
    $granted = Fides_Catalog_Submission_Ownership::grant('organization', 'org:profound-it', 1, 1, 'Smoke test grant');
    if ($granted instanceof WP_Error) {
        throw new RuntimeException($granted->get_error_message());
    }
    assert_true(Fides_Catalog_Submission_Ownership::user_owns('organization', 'org:profound-it', 1), 'Ownership not recorded');
    return 'user 1 owns org:profound-it';
});

// Cleanup smoke rows (keep org:profound-it published row).
$create_id = (int) ($GLOBALS['smoke_create_id'] ?? 0);
$update_id = (int) ($GLOBALS['smoke_update_id'] ?? 0);
foreach (array($create_id, $update_id) as $cleanup_id) {
    if ($cleanup_id > 0) {
        Fides_Catalog_Submissions::delete($cleanup_id);
        echo "CLEAN deleted smoke submission #{$cleanup_id}\n";
    }
}

echo "\nSummary: " . count($results) . ' checks, ' . $failures . " failed\n";
exit($failures > 0 ? 1 : 0);
