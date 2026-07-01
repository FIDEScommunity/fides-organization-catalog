import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
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
      relyingParties: [],
    };
    const declared = normalizeEcosystemRoleCodes(['issuer', 'consultancy']);
    const derived = deriveEcosystemRoleCodesFromLinks(links);
    assert.deepEqual(mergeEcosystemRoleCodes(declared, derived), [
      'personal_wallet_provider',
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
    const codes = normalizeEcosystemRoleCodes(['personal_wallet_provider', 'issuer']);
    assert.equal(ecosystemRoleFilterMatches(codes, 'wallet'), true);
    assert.equal(ecosystemRoleFilterMatches(codes, 'credential'), false);
    assert.equal(ecosystemRoleFilterMatches(codes, 'consultancy'), false);
    assert.equal(ecosystemRoleFilterMatches(['consultancy'], 'consultancy'), true);
  });
});
