import assert from 'node:assert/strict';
import test from 'node:test';
import { validateListingNews } from './listing-news-policy.mjs';

const pilotPolicy = {
  windowDays: 60,
  maxItemsPerOrg: 3,
  firstPartyOnly: true,
  manualReviewRequired: true,
};

function pilotSources(overrides = {}) {
  return {
    pilotPolicy,
    skipOrgIds: [],
    organizations: {
      'org:webuild': {
        listingMode: 'curated-full-pilot',
        indexUrl: 'https://www.webuildconsortium.eu/news',
        allowedHosts: ['www.webuildconsortium.eu'],
        allowedPathPrefixes: ['/news/'],
        ...overrides,
      },
    },
  };
}

function pilotNews(url = 'https://www.webuildconsortium.eu/news/project-update') {
  return {
    generatedAt: '2026-09-22T06:00:00.000Z',
    windowDays: 90,
    maxItemsPerOrg: 5,
    organizations: {
      'org:webuild': {
        items: [
          {
            title: 'WE BUILD project update',
            url,
            publishedAt: '2026-09-18',
            sourceLabel: 'webuildconsortium.eu',
            sourceKind: 'site',
          },
        ],
      },
    },
  };
}

test('accepts explicitly allowlisted curated full-listing news', () => {
  const errors = validateListingNews({
    sources: pilotSources(),
    news: pilotNews(),
    aggregatedOrganizations: [{ id: 'org:webuild', catalogTier: 'Community' }],
    sourceOrganizations: [
      { id: 'org:webuild', catalogTier: 'Community', catalogListingDepth: 'full' },
    ],
  });

  assert.deepEqual(errors, []);
});

test('rejects pilot sources without curated full-listing status', () => {
  const errors = validateListingNews({
    sources: pilotSources(),
    news: pilotNews(),
    aggregatedOrganizations: [{ id: 'org:webuild', catalogTier: 'Community' }],
    sourceOrganizations: [{ id: 'org:webuild', catalogTier: 'Community' }],
  });

  assert.ok(
    errors.includes('org:webuild: curated-full-pilot requires catalogListingDepth "full"'),
  );
});

test('rejects pilot items outside the first-party source boundary', () => {
  const errors = validateListingNews({
    sources: pilotSources(),
    news: pilotNews('https://example.com/general-government-news'),
    aggregatedOrganizations: [{ id: 'org:webuild', catalogTier: 'Community' }],
    sourceOrganizations: [
      { id: 'org:webuild', catalogTier: 'Community', catalogListingDepth: 'full' },
    ],
  });

  assert.ok(errors.some((error) => error.includes('host example.com is not allowlisted')));
  assert.ok(errors.some((error) => error.includes('outside the allowlisted prefixes')));
});

test('rejects Community news without an explicit pilot entry', () => {
  const sources = pilotSources();
  sources.organizations['org:community'] = {
    website: 'https://community.example',
  };
  const news = pilotNews();
  news.organizations = {
    'org:community': {
      items: [
        {
          title: 'General update',
          url: 'https://community.example/news/update',
          publishedAt: '2026-09-18',
          sourceLabel: 'community.example',
          sourceKind: 'site',
        },
      ],
    },
  };

  const errors = validateListingNews({
    sources,
    news,
    aggregatedOrganizations: [{ id: 'org:community', catalogTier: 'Community' }],
    sourceOrganizations: [
      { id: 'org:webuild', catalogTier: 'Community', catalogListingDepth: 'full' },
      { id: 'org:community', catalogTier: 'Community', catalogListingDepth: 'full' },
    ],
  });

  assert.ok(
    errors.includes(
      'org:community: news requires catalogTier "Pro" or an explicit curated-full-pilot source',
    ),
  );
});
