const DAY_MS = 24 * 60 * 60 * 1000;

function asMap(items) {
  return new Map((Array.isArray(items) ? items : []).map((item) => [item.id, item]));
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function parseHttpUrl(value) {
  if (!isNonEmptyString(value)) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

function isPilotSource(source) {
  return source && source.listingMode === 'curated-full-pilot';
}

export function validateListingNews({
  sources,
  news,
  aggregatedOrganizations = [],
  sourceOrganizations = [],
  now = new Date(),
}) {
  const errors = [];
  const configured = sources && sources.organizations;
  const published = news && news.organizations;
  const policy = sources && sources.pilotPolicy;

  if (!configured || typeof configured !== 'object' || Array.isArray(configured)) {
    return ['listing-news-sources.json must contain an organizations object'];
  }
  if (!published || typeof published !== 'object' || Array.isArray(published)) {
    return ['pro-news.json must contain an organizations object'];
  }
  if (!policy || policy.firstPartyOnly !== true || policy.manualReviewRequired !== true) {
    errors.push('pilotPolicy must require first-party sources and manual review');
  }

  const pilotWindowDays = Number(policy && policy.windowDays);
  const pilotMaxItems = Number(policy && policy.maxItemsPerOrg);
  if (!Number.isInteger(pilotWindowDays) || pilotWindowDays < 1) {
    errors.push('pilotPolicy.windowDays must be a positive integer');
  }
  if (!Number.isInteger(pilotMaxItems) || pilotMaxItems < 1) {
    errors.push('pilotPolicy.maxItemsPerOrg must be a positive integer');
  }

  const aggregateById = asMap(aggregatedOrganizations);
  const sourceById = asMap(sourceOrganizations);
  const skipped = new Set(Array.isArray(sources.skipOrgIds) ? sources.skipOrgIds : []);

  for (const [orgId, source] of Object.entries(configured)) {
    if (!isPilotSource(source)) continue;
    const organization = sourceById.get(orgId);
    if (!organization) {
      errors.push(`${orgId}: pilot organization is missing from community-catalogs`);
      continue;
    }
    if (organization.catalogListingDepth !== 'full') {
      errors.push(`${orgId}: curated-full-pilot requires catalogListingDepth "full"`);
    }
    if (organization.listingNewsEnabled === false) {
      errors.push(`${orgId}: pilot organization has opted out of listing news`);
    }
    if (!parseHttpUrl(source.indexUrl)) {
      errors.push(`${orgId}: pilot source requires a valid indexUrl`);
    }
    if (!Array.isArray(source.allowedHosts) || source.allowedHosts.length === 0) {
      errors.push(`${orgId}: pilot source requires allowedHosts`);
    }
    if (!Array.isArray(source.allowedPathPrefixes) || source.allowedPathPrefixes.length === 0) {
      errors.push(`${orgId}: pilot source requires allowedPathPrefixes`);
    }
  }

  const generatedAt = new Date(news.generatedAt || now);
  const anchor = Number.isNaN(generatedAt.getTime()) ? now : generatedAt;
  if (Number.isNaN(generatedAt.getTime())) {
    errors.push('pro-news.json generatedAt must be a valid date');
  }

  const defaultMaxItems = Number(news.maxItemsPerOrg) || 5;
  const defaultWindowDays = Number(news.windowDays) || 90;
  const seenUrls = new Set();

  for (const [orgId, entry] of Object.entries(published)) {
    if (skipped.has(orgId)) {
      errors.push(`${orgId}: skipped organization must not have published news`);
    }

    const source = configured[orgId];
    const pilot = isPilotSource(source);
    const aggregate = aggregateById.get(orgId);
    const sourceOrganization = sourceById.get(orgId);
    const newsDisabled =
      aggregate?.listingNewsEnabled === false || sourceOrganization?.listingNewsEnabled === false;

    if (newsDisabled) {
      errors.push(`${orgId}: organization has opted out of listing news`);
    }
    if (!pilot && aggregate?.catalogTier !== 'Pro') {
      errors.push(`${orgId}: news requires catalogTier "Pro" or an explicit curated-full-pilot source`);
    }

    const items = entry && entry.items;
    if (!Array.isArray(items) || items.length === 0) {
      errors.push(`${orgId}: news entry must contain at least one item`);
      continue;
    }

    const maxItems = pilot ? pilotMaxItems : defaultMaxItems;
    const windowDays = pilot ? pilotWindowDays : defaultWindowDays;
    if (items.length > maxItems) {
      errors.push(`${orgId}: ${items.length} items exceeds the ${maxItems}-item limit`);
    }

    for (const [index, item] of items.entries()) {
      const label = `${orgId}.items[${index}]`;
      if (!isNonEmptyString(item?.title)) errors.push(`${label}: title is required`);
      if (!isNonEmptyString(item?.sourceLabel)) errors.push(`${label}: sourceLabel is required`);
      if (!['site', 'github_release'].includes(item?.sourceKind)) {
        errors.push(`${label}: sourceKind must be site or github_release`);
      }

      const articleUrl = parseHttpUrl(item?.url);
      if (!articleUrl) {
        errors.push(`${label}: url must be HTTP(S)`);
      } else {
        const normalizedUrl = articleUrl.toString();
        if (seenUrls.has(normalizedUrl)) errors.push(`${label}: duplicate URL ${normalizedUrl}`);
        seenUrls.add(normalizedUrl);

        if (pilot) {
          const allowedHosts = source.allowedHosts.map((host) => String(host).toLowerCase());
          if (!allowedHosts.includes(articleUrl.hostname.toLowerCase())) {
            errors.push(`${label}: host ${articleUrl.hostname} is not allowlisted`);
          }
          const allowedPath = source.allowedPathPrefixes.some((prefix) =>
            articleUrl.pathname.startsWith(String(prefix)),
          );
          if (!allowedPath) {
            errors.push(`${label}: path ${articleUrl.pathname} is outside the allowlisted prefixes`);
          }
          const indexUrl = parseHttpUrl(source.indexUrl);
          if (indexUrl && articleUrl.toString() === indexUrl.toString()) {
            errors.push(`${label}: index pages cannot be published as news items`);
          }
        }
      }

      const publishedAt = new Date(`${item?.publishedAt}T00:00:00Z`);
      if (!isNonEmptyString(item?.publishedAt) || Number.isNaN(publishedAt.getTime())) {
        errors.push(`${label}: publishedAt must be a YYYY-MM-DD date`);
      } else {
        const ageDays = (anchor.getTime() - publishedAt.getTime()) / DAY_MS;
        if (ageDays < -1) errors.push(`${label}: publishedAt is in the future`);
        if (ageDays > windowDays) {
          errors.push(`${label}: item is older than the ${windowDays}-day window`);
        }
      }

      if (
        item?.walletIds !== undefined &&
        (!Array.isArray(item.walletIds) ||
          item.walletIds.some((walletId) => !isNonEmptyString(walletId)))
      ) {
        errors.push(`${label}: walletIds must be an array of non-empty strings`);
      }
    }
  }

  return errors;
}
