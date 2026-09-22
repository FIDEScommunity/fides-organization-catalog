import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateListingNews } from './listing-news-policy.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function loadSourceOrganizations() {
  const catalogsRoot = path.join(root, 'community-catalogs');
  const organizations = [];

  for (const entry of fs.readdirSync(catalogsRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const catalogPath = path.join(catalogsRoot, entry.name, 'organization-catalog.json');
    if (!fs.existsSync(catalogPath)) continue;
    const document = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
    if (document.organization) organizations.push(document.organization);
  }

  return organizations;
}

const sources = readJson('data/listing-news-sources.json');
const news = readJson('data/pro-news.json');
const aggregated = readJson('data/aggregated.json');
const errors = validateListingNews({
  sources,
  news,
  aggregatedOrganizations: aggregated.organizations,
  sourceOrganizations: loadSourceOrganizations(),
});

if (errors.length > 0) {
  console.error(`Listing news validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  const pilotCount = Object.values(sources.organizations).filter(
    (source) => source.listingMode === 'curated-full-pilot',
  ).length;
  console.log(
    `Listing news is valid (${Object.keys(news.organizations).length} organizations, ${pilotCount} curated-full pilots).`,
  );
}
