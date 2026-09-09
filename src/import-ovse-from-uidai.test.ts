import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  applyOvseToExisting,
  buildNewOvseOrganization,
  matchExistingOrg,
  buildIndex,
  dropShorterPrefixDuplicates,
  normalizeOrgName,
  parseOvseNamesFromText,
  removeOvseFromExisting,
  slugify,
} from '../scripts/lib/ovseFromUidai.mjs';

const SAMPLE = `
List of Registered Offline Verification Seeking Entity
As on 15.07.2026
SI.No. Entity Name
1 Digital India Corporation
2 Ayanworks Technology Solutions Private Limited
3 Arattai Technology Solutions Private Limited
4 Dusane Infotech (India) Private Limited
5 Signzy Technologies Private Limited
38 Dusane Infotech (India) Private Limited
-- 1 of 63 --
166 National Stock Exchange of India Limited
List of Sub-AUA_Sub-KUA
(As on 04.06.2026)
1 APTOnline Office of the Principal Controller
`;

describe('parseOvseNamesFromText', () => {
  it('reads the first table and stops before Sub-AUA', () => {
    const names = parseOvseNamesFromText(SAMPLE);
    assert.ok(names.includes('Digital India Corporation'));
    assert.ok(names.includes('National Stock Exchange of India Limited'));
    assert.equal(names.some((n) => /APTOnline/i.test(n)), false);
  });

  it('deduplicates repeated entity names', () => {
    const names = parseOvseNamesFromText(SAMPLE);
    const dusane = names.filter((n) => /Dusane/i.test(n));
    assert.equal(dusane.length, 1);
  });

  it('drops a short name when a longer prefixed name exists', () => {
    const names = dropShorterPrefixDuplicates([
      'Hyperverge',
      'Hyperverge Technologies Private Limited',
      'Signzy Technologies Private Limited',
    ]);
    assert.deepEqual(names, [
      'Hyperverge Technologies Private Limited',
      'Signzy Technologies Private Limited',
    ]);
  });
});

describe('normalizeOrgName', () => {
  it('strips Indian legal suffixes', () => {
    assert.equal(
      normalizeOrgName('Ayanworks Technology Solutions Private Limited'),
      'ayanworks technology solutions',
    );
  });
});

describe('matchExistingOrg', () => {
  const index = buildIndex([
    { organization: { id: 'org:ayanworks', name: 'AyanWorks Technology Solutions Pvt. Ltd.' } },
    { organization: { id: 'org:arattai', name: 'Arattai' } },
  ]);

  it('matches AyanWorks via alias / normalized name', () => {
    const hit = matchExistingOrg('Ayanworks Technology Solutions Private Limited', index);
    assert.equal(hit.kind, 'match');
    assert.equal(hit.record.slug, 'ayanworks');
  });

  it('matches Arattai via manual alias', () => {
    const hit = matchExistingOrg('Arattai Technology Solutions Private Limited', index);
    assert.equal(hit.kind, 'match');
    assert.equal(hit.record.slug, 'arattai');
  });

  it('returns none for an unknown entity', () => {
    const hit = matchExistingOrg('National Stock Exchange of India Limited', index);
    assert.equal(hit.kind, 'none');
  });
});

describe('applyOvseToExisting', () => {
  it('adds cert and relying_party without bumping lastUpdated', () => {
    const doc = {
      organization: {
        id: 'org:ayanworks',
        name: 'AyanWorks',
        sectors: ['digital'],
        ecosystemRoleCodes: ['software_vendor'],
      },
      lastUpdated: '2026-07-02T09:53:51+00:00',
    };
    const { changed, json } = applyOvseToExisting(doc);
    assert.equal(changed, true);
    assert.equal(json.lastUpdated, '2026-07-02T09:53:51+00:00');
    const codes = json.organization.certifications.map((c) => c.code);
    assert.ok(codes.includes('uidai_ovse'));
    assert.ok(json.organization.ecosystemRoleCodes.includes('relying_party'));
    assert.ok(json.organization.ecosystemRoleCodes.includes('software_vendor'));
  });

  it('is idempotent', () => {
    const doc = {
      organization: {
        id: 'org:ayanworks',
        name: 'AyanWorks',
        sectors: ['digital'],
        certifications: [
          {
            code: 'uidai_ovse',
            evidence: {
              kind: 'url',
              url: 'https://uidai.gov.in/en/ovse',
              label: 'UIDAI registered Offline Verification Seeking Entity',
            },
          },
        ],
        ecosystemRoleCodes: ['relying_party'],
      },
    };
    const { changed } = applyOvseToExisting(doc);
    assert.equal(changed, false);
  });
});

describe('removeOvseFromExisting', () => {
  it('drops only the OVSE cert', () => {
    const { changed, json } = removeOvseFromExisting({
      organization: {
        id: 'org:example',
        certifications: [{ code: 'uidai_ovse' }, { code: 'iso27001' }],
      },
    });
    assert.equal(changed, true);
    assert.deepEqual(json.organization.certifications.map((c) => c.code), ['iso27001']);
  });
});

describe('buildNewOvseOrganization', () => {
  it('creates a Community listing in India', () => {
    const doc = buildNewOvseOrganization({
      slug: 'digital-india-corporation',
      legalName: 'Digital India Corporation',
    });
    assert.equal(doc.organization.id, 'org:digital-india-corporation');
    assert.equal(doc.organization.country, 'IN');
    assert.equal(doc.organization.catalogTier, 'Community');
    assert.equal(doc.organization.certifications[0].code, 'uidai_ovse');
    assert.ok(!doc.organization.website);
  });
});

describe('slugify', () => {
  it('builds folder slugs from normalized names', () => {
    assert.equal(slugify('digital india corporation'), 'digital-india-corporation');
  });
});
