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
      trustSchemes: [],
      trustRegistries: [],
    };
    const declared = normalizeEcosystemRoleCodes(['issuer', 'consultancy']);
    const derived = deriveEcosystemRoleCodesFromLinks(links);
    assert.deepEqual(mergeEcosystemRoleCodes(declared, derived), [
      'personal_wallet_provider',
      'issuer',
      'consultancy',
    ]);
  });

  it('derives roles from trust scheme and registry links', () => {
    const derived = deriveEcosystemRoleCodesFromLinks({
      issuers: [],
      credentialTypes: [],
      personalWallets: [],
      businessWallets: [],
      relyingParties: [],
      trustSchemes: [
        { id: 'scheme:iso-iec-27001', displayName: 'ISO/IEC 27001', role: 'scheme_owner' },
        { id: 'scheme:eidas-2-0', displayName: 'eIDAS 2.0', role: 'standards_body' },
        { id: 'scheme:web-pki', displayName: 'Web PKI', role: 'supervisory_body' },
      ],
      trustRegistries: [
        { id: 'treg:eidas-1-0:de-tl', displayName: 'German TL', schemeId: 'scheme:eidas-1-0', role: 'operator' },
      ],
    });
    assert.deepEqual(derived, [
      'conformity_scheme_owner',
      'standards_development_organization',
      'trust_infrastructure_provider',
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
