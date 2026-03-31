import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeOrgName,
  matchesByName,
  matchesByDid,
  orgCodeFromId,
  orgCodeFromIssuerId,
  orgCodeFromCredentialId,
  matchesOrganization,
  orgNameExtendsProvider,
} from './matching.js';

describe('normalizeOrgName', () => {
  it('lowercases and trims', () => {
    assert.equal(normalizeOrgName('  Animo  '), 'animo');
  });

  it('collapses whitespace', () => {
    assert.equal(normalizeOrgName('European  Commission'), 'european commission');
  });

  it('normalizes smart quotes', () => {
    assert.equal(normalizeOrgName("it\u2019s"), "it's");
  });
});

describe('matchesByName', () => {
  it('matches same name', () => {
    assert.ok(matchesByName('Animo', 'Animo'));
  });

  it('matches case-insensitively', () => {
    assert.ok(matchesByName('FIDES Labs', 'fides labs'));
  });

  it('does not match different names', () => {
    assert.ok(!matchesByName('Animo', 'Sphereon'));
  });

  it('matches with extra whitespace', () => {
    assert.ok(matchesByName('  Animo ', 'Animo'));
  });
});

describe('matchesByDid', () => {
  it('matches identical DIDs', () => {
    assert.ok(matchesByDid('did:web:animo.id', 'did:web:animo.id'));
  });

  it('returns false when one DID is undefined', () => {
    assert.ok(!matchesByDid('did:web:animo.id', undefined));
    assert.ok(!matchesByDid(undefined, 'did:web:animo.id'));
  });

  it('returns false for different DIDs', () => {
    assert.ok(!matchesByDid('did:web:animo.id', 'did:web:sphereon.com'));
  });
});

describe('orgCodeFromId', () => {
  it('strips org: prefix', () => {
    assert.equal(orgCodeFromId('org:animo'), 'animo');
  });

  it('handles hyphenated codes', () => {
    assert.equal(orgCodeFromId('org:ca-dmv'), 'ca-dmv');
  });
});

describe('orgCodeFromIssuerId', () => {
  it('returns second segment for issuer ids', () => {
    assert.equal(orgCodeFromIssuerId('issuer:animo:bundesdruckerei:test'), 'animo');
  });

  it('lowercases org code', () => {
    assert.equal(orgCodeFromIssuerId('issuer:EWC:ewc-issuer:test'), 'ewc');
  });

  it('returns undefined for invalid ids', () => {
    assert.equal(orgCodeFromIssuerId('wallet:foo'), undefined);
    assert.equal(orgCodeFromIssuerId('issuer'), undefined);
  });
});

describe('orgCodeFromCredentialId', () => {
  it('returns second segment for cred ids', () => {
    assert.equal(orgCodeFromCredentialId('cred:ewc:pda1-sd-jwt:sd-jwt-vc'), 'ewc');
  });

  it('returns undefined for non-cred ids', () => {
    assert.equal(orgCodeFromCredentialId('issuer:ewc:foo'), undefined);
  });
});

describe('orgNameExtendsProvider', () => {
  it('matches EU-style role suffix after provider name', () => {
    assert.ok(orgNameExtendsProvider('European Commission - Government', 'European Commission'));
    assert.ok(orgNameExtendsProvider('European Commission – Government', 'European Commission'));
  });

  it('does not match unrelated continuation without separator', () => {
    assert.ok(!orgNameExtendsProvider('European Union', 'European'));
  });
});

describe('matchesOrganization', () => {
  const org = { id: 'org:animo', name: 'Animo', did: 'did:web:animo.id' };

  it('matches by name', () => {
    assert.ok(matchesOrganization(org, { name: 'Animo' }));
  });

  it('matches by DID', () => {
    assert.ok(matchesOrganization(org, { name: 'Different', did: 'did:web:animo.id' }));
  });

  it('matches by directory name', () => {
    assert.ok(matchesOrganization(org, { name: 'Something Else', dirName: 'animo' }));
  });

  it('does not match unrelated org', () => {
    assert.ok(!matchesOrganization(org, { name: 'Sphereon', did: 'did:web:sphereon.com', dirName: 'sphereon' }));
  });

  it('matches credential provider when org name adds role suffix', () => {
    const eu = { id: 'org:eu', name: 'European Commission - Government' };
    assert.ok(matchesOrganization(eu, { name: 'European Commission' }));
  });

  it('matches by legalName to catalog provider', () => {
    const eu = {
      id: 'org:eu',
      name: 'EU Wallet Programme',
      legalName: 'European Commission',
    };
    assert.ok(matchesOrganization(eu, { name: 'European Commission' }));
  });

  it('matches Animo Solutions to issuer via issuer id org segment when names differ', () => {
    const animoOrg = { id: 'org:animo', name: 'Animo Solutions', did: 'did:web:animo.id' };
    assert.ok(
      matchesOrganization(animoOrg, {
        name: 'Animo',
        dirName: orgCodeFromIssuerId('issuer:animo:bundesdruckerei:test'),
      }),
    );
  });

  it('matches EWC org to credentials via cred id org segment when provider name differs', () => {
    const ewcOrg = { id: 'org:ewc', name: 'EWC - European Wallet Consortium' };
    assert.ok(
      matchesOrganization(ewcOrg, {
        name: 'University of the Aegean / EWC',
        dirName: orgCodeFromCredentialId('cred:ewc:pda1-sd-jwt:sd-jwt-vc'),
      }),
    );
  });
});
