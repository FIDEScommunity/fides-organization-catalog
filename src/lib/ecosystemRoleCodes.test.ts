import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyWalletConnectorRoleCodeGate,
  includeWalletConnectorRoleCode,
  deriveEcosystemRoleCodesFromLinks,
  ecosystemRoleFilterMatches,
  mergeEcosystemRoleCodes,
  normalizeEcosystemRoleCodes,
} from './ecosystemRoleCodes.js';

describe('ecosystemRoleCodes', () => {
  it('merges declared and derived roles without duplicates', () => {
    const links = {
      issuers: [{ id: 'issuer:a', displayName: 'A' }],
      credentialTypes: [],
      personalWallets: [{ id: 'wallet:a', displayName: 'W' }],
      businessWallets: [],
      walletConnectors: [{ id: 'connector:a', displayName: 'Connector A' }],
      relyingParties: [],
    };
    const declared = normalizeEcosystemRoleCodes(['issuer', 'consultancy']);
    const derived = deriveEcosystemRoleCodesFromLinks(links);
    assert.deepEqual(mergeEcosystemRoleCodes(declared, derived), [
      'personal_wallet_provider',
      'wallet_connector_provider',
      'issuer',
      'consultancy',
    ]);
  });

  it('drops unknown codes and preserves schema order', () => {
    assert.deepEqual(normalizeEcosystemRoleCodes(['consultancy', 'not_a_role', 'issuer']), [
      'issuer',
      'consultancy',
    ]);
  });

  it('supports legacy filter aliases', () => {
    const codes = normalizeEcosystemRoleCodes(['personal_wallet_provider', 'wallet_connector_provider', 'issuer']);
    assert.equal(ecosystemRoleFilterMatches(codes, 'wallet'), true);
    assert.equal(ecosystemRoleFilterMatches(codes, 'credential'), false);
    assert.equal(ecosystemRoleFilterMatches(codes, 'connector'), true);
    assert.equal(ecosystemRoleFilterMatches(codes, 'consultancy'), false);
    assert.equal(ecosystemRoleFilterMatches(['consultancy'], 'consultancy'), true);
  });

  it('gates wallet_connector_provider behind FIDES_INCLUDE_WALLET_CONNECTOR_ROLE_CODE (default off)', () => {
    assert.equal(includeWalletConnectorRoleCode({}), false);
    assert.equal(includeWalletConnectorRoleCode({ FIDES_INCLUDE_WALLET_CONNECTOR_ROLE_CODE: '0' }), false);
    assert.equal(includeWalletConnectorRoleCode({ FIDES_INCLUDE_WALLET_CONNECTOR_ROLE_CODE: '1' }), true);
    assert.equal(includeWalletConnectorRoleCode({ FIDES_INCLUDE_WALLET_CONNECTOR_ROLE_CODE: 'true' }), true);
    const codes = normalizeEcosystemRoleCodes(['issuer', 'wallet_connector_provider']);
    assert.deepEqual(applyWalletConnectorRoleCodeGate(codes, false), ['issuer']);
    assert.deepEqual(applyWalletConnectorRoleCodeGate(codes, true), ['wallet_connector_provider', 'issuer']);
  });
});
