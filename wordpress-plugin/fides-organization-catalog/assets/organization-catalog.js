/**
 * FIDES Organization Catalog - WordPress Plugin JavaScript
 */
(function () {
  'use strict';

  const icons = {
    search: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>',
    filter: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>',
    chevronDown: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"></path></svg>',
    chevronDoubleDown: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 8 6 6 6-6"></path><path d="m6 14 6 6 6-6"></path></svg>',
    chevronUp: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"></path></svg>',
    x: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>',
    xSmall: '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>',
    xLarge: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>',
    externalLink: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" x2="21" y1="14" y2="3"></line></svg>',
    building: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>',
    fileCheck: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m9 15 2 2 4-4"/></svg>',
    shield: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>',
    wallet: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>',
    server: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>',
    share: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>',
    pencil: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>',
    check: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    qtsp: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="2.5" y="4" width="19" height="16" rx="2.5" fill="#1E3A8A"/><circle cx="12" cy="7.2" r="0.8" fill="#FACC15"/><circle cx="15.2" cy="8.2" r="0.8" fill="#FACC15"/><circle cx="16.8" cy="11" r="0.8" fill="#FACC15"/><circle cx="15.8" cy="14.2" r="0.8" fill="#FACC15"/><circle cx="13" cy="15.8" r="0.8" fill="#FACC15"/><circle cx="9.8" cy="14.8" r="0.8" fill="#FACC15"/><circle cx="8.2" cy="12" r="0.8" fill="#FACC15"/><circle cx="9.2" cy="8.8" r="0.8" fill="#FACC15"/><path d="M8.6 12.6l2.1 2.1 4.8-4.8" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    /** Lucide "circle-check" — official (Pro) account claimed by the organization */
    official: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>',
    /** Lucide "users" — FIDES Manifesto / community supporter badge */
    community: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    /** Lucide "badge-check" — DIACC PCTF certified badge */
    diacc: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/></svg>',
    eye: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
    globe: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>',
    tag: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></svg>',
    /** Lucide "briefcase" — commercial offerings (distinct from sector/tag chips). */
    offerings: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/></svg>',
    /** Lucide "layers" — use cases the organization is involved in. */
    useCases: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/><path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/><path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/></svg>',
    viewGrid: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>',
    viewList: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>',
  };

  /** Explicit English labels where we prefer a fixed string over Intl (or legacy fallback if Intl is unavailable). */
  const COUNTRY_NAMES = {
    'AD': 'Andorra', 'AL': 'Albania', 'AT': 'Austria', 'AU': 'Australia',
    'BE': 'Belgium', 'BG': 'Bulgaria', 'BA': 'Bosnia and Herzegovina',
    'BT': 'Bhutan', 'BR': 'Brazil',
    'CA': 'Canada', 'CH': 'Switzerland', 'CY': 'Cyprus', 'CZ': 'Czech Republic',
    'EU': 'European Union',
    'DE': 'Germany', 'DK': 'Denmark', 'EE': 'Estonia', 'ES': 'Spain',
    'ET': 'Ethiopia', 'FI': 'Finland', 'FR': 'France', 'GB': 'United Kingdom',
    'GR': 'Greece', 'HN': 'Honduras', 'HR': 'Croatia', 'HU': 'Hungary',
    'IE': 'Ireland', 'IL': 'Israel', 'IN': 'India', 'IS': 'Iceland',
    'IT': 'Italy', 'JP': 'Japan', 'KR': 'South Korea',
    'XK': 'Kosovo', 'LI': 'Liechtenstein', 'LT': 'Lithuania', 'LU': 'Luxembourg',
    'LV': 'Latvia', 'MC': 'Monaco', 'MD': 'Moldova', 'ME': 'Montenegro',
    'MK': 'North Macedonia', 'MT': 'Malta', 'NL': 'Netherlands', 'NO': 'Norway',
    'NZ': 'New Zealand', 'PG': 'Papua New Guinea', 'PL': 'Poland', 'PT': 'Portugal',
    'RO': 'Romania', 'RS': 'Serbia', 'SE': 'Sweden', 'SG': 'Singapore',
    'SI': 'Slovenia', 'SK': 'Slovakia', 'SM': 'San Marino', 'TR': 'Turkey',
    'UA': 'Ukraine', 'US': 'United States', 'VA': 'Vatican City',
  };

  let regionDisplayNamesEn = null;

  function getRegionDisplayNamesEn() {
    if (regionDisplayNamesEn !== null) return regionDisplayNamesEn;
    try {
      if (typeof Intl !== 'undefined' && Intl.DisplayNames) {
        regionDisplayNamesEn = new Intl.DisplayNames(['en'], { type: 'region' });
      } else {
        regionDisplayNamesEn = false;
      }
    } catch (e) {
      regionDisplayNamesEn = false;
    }
    return regionDisplayNamesEn;
  }

  /**
   * ISO 3166-1 alpha-2 (or EU) → English display name.
   * Uses Intl.DisplayNames for full coverage; COUNTRY_NAMES overrides when set.
   */
  function countryName(code) {
    if (code == null) return '';
    const raw = String(code).trim();
    if (!raw) return '';
    const upper = raw.toUpperCase();
    if (COUNTRY_NAMES[upper]) return COUNTRY_NAMES[upper];
    const dn = getRegionDisplayNamesEn();
    if (dn) {
      try {
        const n = dn.of(upper);
        if (typeof n === 'string' && n.length > 0 && n.toUpperCase() !== upper) return n;
      } catch (e) {
        /* ignore */
      }
    }
    return upper;
  }

  function normalizeOrgCountryCode(code) {
    if (code == null) return '';
    const upper = String(code).trim().toUpperCase();
    if (upper.length !== 2 || !/^[A-Z]{2}$/.test(upper)) return '';
    return upper;
  }

  /** Compact country flag for list rows (tooltip = country name). */
  function renderOrgCountryListFlag(org) {
    const code = normalizeOrgCountryCode(org && org.country);
    if (!code) return '';
    const label = countryName(code);
    return `<span class="fides-catalog-country-meta fides-catalog-country-meta--icon-only" title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}"><img src="https://flagcdn.com/w40/${encodeURIComponent(code.toLowerCase())}.png" alt="" class="fides-org-list-country-flag" width="18" height="13" loading="lazy" decoding="async" /></span>`;
  }

  /** @deprecated Use renderOrgCountryListFlag. */
  function renderOrgCountryGlobeIcon(org) {
    return renderOrgCountryListFlag(org);
  }

  function renderOrgCountryMeta(org) {
    const code = normalizeOrgCountryCode(org && org.country);
    if (!code) return '';
    const label = countryName(code);
    if (window.FidesCatalogUI && typeof window.FidesCatalogUI.buildCatalogCountryGlobeMetaHtml === 'function') {
      return window.FidesCatalogUI.buildCatalogCountryGlobeMetaHtml(label);
    }
    return `<span class="fides-catalog-country-meta" title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}">${icons.globe}<span class="fides-org-provider-text">${escapeHtml(label)}</span></span>`;
  }

  /** @deprecated Use renderOrgCountryListFlag (list) or renderOrgCountryMeta (card/modal). */
  function renderOrgCountryFlag(org) {
    return renderOrgCountryListFlag(org);
  }

  function renderOrgCountryModalFlag(org) {
    if (window.FidesCatalogUI && typeof window.FidesCatalogUI.buildOrganizationCountryModalFlagHtml === 'function') {
      return window.FidesCatalogUI.buildOrganizationCountryModalFlagHtml(org, { countryNames: COUNTRY_NAMES });
    }
    const code = normalizeOrgCountryCode(org && org.country);
    if (!code) return '';
    const label = countryName(code);
    return ` <span class="fides-modal-provider-country" title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}"><img src="https://flagcdn.com/w40/${encodeURIComponent(code.toLowerCase())}.png" alt="" class="fides-modal-country-flag" width="18" height="13" loading="lazy" decoding="async" /></span>`;
  }

  function renderOrgCountryFilterFlag(code) {
    const normalized = normalizeOrgCountryCode(code);
    if (!normalized) return '';
    return `<img src="https://flagcdn.com/w20/${encodeURIComponent(normalized.toLowerCase())}.png" alt="" class="fides-country-flag" width="16" height="12" loading="lazy" decoding="async" />`;
  }

  function logoFallbackFromWebsite(website) {
    if (typeof website !== 'string' || !website.trim()) return '';
    try {
      const parsed = new URL(website);
      if (!parsed.hostname) return '';
      const host = parsed.hostname.toLowerCase();
      // Google favicon fallback is known to return 404 for these hosts.
      if (
        host === 'pki.atos.net' ||
        host === 'crl.pass-in.fr' ||
        host === 'pass-in.fr' ||
        host === 'ss-in.fr'
      ) {
        return '';
      }
      return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(parsed.hostname)}&sz=128`;
    } catch {
      return '';
    }
  }

  function parsedHostname(url) {
    if (typeof url !== 'string' || !url.trim()) return '';
    try {
      return new URL(url).hostname.toLowerCase();
    } catch {
      return '';
    }
  }

  function shouldBypassPrimaryLogo(logoUrl) {
    const host = parsedHostname(logoUrl);
    if (!host) return false;
    // Hosts known to return strict CORP / protocol behavior in browsers.
    return (
      host === 'eportugal.gov.pt' ||
      host === 'globaltrust.eu' ||
      host === 'www.globaltrust.eu' ||
      host === 'www.pec.it' ||
      host === 'www.bancaditalia.it' ||
      host === 'digitelts.es' ||
      host === 'www.digitelts.es' ||
      host === 'pki.multicert.com' ||
      host === 'pki.atos.net' ||
      host === 'crl.pass-in.fr' ||
      host === 'pass-in.fr' ||
      host === 'ss-in.fr'
    );
  }

  function resolvedLogoUrl(org) {
    const primary = typeof org?.logoUri === 'string' ? org.logoUri : '';
    const fallback = logoFallbackFromWebsite(org?.website);
    if (!primary) return '';
    if (shouldBypassPrimaryLogo(primary)) return fallback || '';
    return primary;
  }

  function bindLogoFallbackHandlers(scope) {
    if (!scope || typeof scope.querySelectorAll !== 'function') return;
    scope.querySelectorAll('img[data-fides-logo-fallback]').forEach((img) => {
      if (img.dataset.fidesLogoBound === '1') return;
      img.dataset.fidesLogoBound = '1';
      img.addEventListener('error', () => {
        const fallback = img.dataset.fidesLogoFallback || '';
        if (fallback && img.dataset.fidesLogoTriedFallback !== '1') {
          img.dataset.fidesLogoTriedFallback = '1';
          img.src = fallback;
          return;
        }
        img.removeAttribute('src');
      });
    });
  }

  /** Schema key order for Organization identifiers and search (labels in English). */
  const ORG_IDENTIFIER_FIELDS = [
    ['did', 'DID'],
    ['business_registration_number', 'Business registration number'],
    ['vat_number', 'VAT number'],
    ['lei', 'LEI'],
    ['eori', 'EORI'],
    ['euid', 'EUID'],
    ['duns', 'D-U-N-S'],
    ['gln', 'GLN'],
  ];

  function orgCatalogDid(org) {
    const d = org && org.identifiers && org.identifiers.did;
    return typeof d === 'string' && d.trim() ? d.trim() : '';
  }

  function orgIdentifierValuesForSearch(org) {
    const idents = org && org.identifiers;
    if (!idents || typeof idents !== 'object') return '';
    return ORG_IDENTIFIER_FIELDS.map(([k]) => idents[k])
      .filter((v) => typeof v === 'string' && v.trim())
      .join(' ')
      .toLowerCase();
  }

  function renderOrganizationIdentifierRows(org) {
    const idents = org && org.identifiers;
    if (!idents || typeof idents !== 'object') return '';
    const parts = [];
    for (const [key, label] of ORG_IDENTIFIER_FIELDS) {
      const raw = idents[key];
      if (typeof raw !== 'string' || !raw.trim()) continue;
      const val = raw.trim();
      if (key === 'did') {
        parts.push(`<div class="fides-kv-row"><span class="fides-kv-key">${escapeHtml(label)}</span><span class="fides-kv-val"><code class="fides-modal-provider-did fides-modal-provider-did--inline">${escapeHtml(val)}</code></span></div>`);
      } else {
        parts.push(`<div class="fides-kv-row"><span class="fides-kv-key">${escapeHtml(label)}</span><span class="fides-kv-val">${escapeHtml(val)}</span></div>`);
      }
    }
    return parts.join('');
  }

  /** ISO 3166-1 alpha-2 → regional indicator flag emoji (e.g. NL → 🇳🇱). */
  function flagEmojiFromAlpha2(code) {
    if (!code || typeof code !== 'string') return '';
    const upper = code.trim().toUpperCase();
    if (upper.length !== 2) return '';
    const base = 0x1f1e6;
    const toCp = (ch) => {
      const u = ch.charCodeAt(0);
      if (u < 65 || u > 90) return null;
      return base + (u - 65);
    };
    const a = toCp(upper[0]);
    const b = toCp(upper[1]);
    if (a == null || b == null) return '';
    return String.fromCodePoint(a, b);
  }

  const ROLE_LABELS = {
    issuers: 'Issuers',
    credentialTypes: 'Credential Types',
    personalWallets: 'Personal Wallets',
    businessWallets: 'Business Wallets',
    relyingParties: 'Relying Parties',
  };

  const ROLE_ICONS = {
    issuers: icons.server,
    credentialTypes: icons.fileCheck,
    personalWallets: icons.wallet,
    businessWallets: icons.wallet,
    relyingParties: icons.shield,
  };

  function isFidesLocalDevHost() {
    try {
      const h = window.location.hostname || '';
      const href = window.location.href || '';
      return h.includes('.local') || href.includes('.local');
    } catch {
      return false;
    }
  }

  const configDefaults = {
    pluginUrl: '',
    githubDataUrl: 'https://raw.githubusercontent.com/FIDEScommunity/fides-organization-catalog/main/data/aggregated.json',
    aggregatedDataVersion: '',
    issuerCatalogUrl: '',
    credentialCatalogUrl: '',
    walletCatalogUrl: '',
    rpCatalogUrl: '',
    useCaseCatalogUrl: 'https://fides.community/ecosystem-explorer/use-cases/',
    useCaseAggregatedDataUrl: 'https://raw.githubusercontent.com/FIDEScommunity/fides-use-case-catalog/main/data/aggregated.json',
    bluePagesRestUrl: '',
    bluePagesProfileBaseUrl: '',
    ratingsApiBase: '',
    updateFormUrl: '',
    plansUrl: 'https://fides.community/plans/',
    showOfficialProfileCta: true,
    isLoggedIn: false,
    editAccess: { isLoggedIn: false, isAdmin: false, ownedOrgIds: [], proOrgIds: [] },
    tierUiEnabled: false,
  };
  const config = Object.assign({}, configDefaults, window.fidesOrganizationCatalog || {});

  function syncCatalogConfig() {
    if (window.fidesOrganizationCatalog && typeof window.fidesOrganizationCatalog === 'object') {
      Object.assign(config, window.fidesOrganizationCatalog);
    }
  }

  /** Match wallet catalog: read live window config (truthy), not strict === true at parse time. */
  function tierUiEnabled() {
    const live = window.fidesOrganizationCatalog;
    if (live && typeof live === 'object' && live.tierUiEnabled != null) {
      return !!live.tierUiEnabled;
    }
    return !!config.tierUiEnabled;
  }

  const RATINGS_API_BASE = (config.ratingsApiBase || '').replace(/\/$/, '');
  const RATINGS_BATCH_LIMIT = 100;
  const ratingSummariesByType = {
    issuer: Object.create(null),
    credential: Object.create(null),
    wallet: Object.create(null),
    rp: Object.create(null),
    usecase: Object.create(null),
  };

  function userCanEditOrganization(org) {
    if (!tierUiEnabled()) {
      if (config.editAccess && config.editAccess.isAdmin) return true;
      return !!config.isLoggedIn;
    }
    const access = config.editAccess && typeof config.editAccess === "object" ? config.editAccess : null;
    if (window.FidesCatalogUI && typeof window.FidesCatalogUI.canEditOrganization === "function") {
      return window.FidesCatalogUI.canEditOrganization(org, { editAccess: access, isLoggedIn: config.isLoggedIn });
    }
    const orgId = org && org.id ? String(org.id).trim() : "";
    if (access && access.isAdmin) return true;
    if (!config.isLoggedIn || !orgId) return false;
    const ownedOrgIds = Array.isArray(access && access.ownedOrgIds) ? access.ownedOrgIds : [];
    if (!orgCatalogTierIsPro(org)) return true;
    return ownedOrgIds.indexOf(orgId) >= 0;
  }

  function organizationUpdateFormUrl(orgId) {
    const org = organizations.find((o) => o.id === orgId) || { id: orgId };
    if (!userCanEditOrganization(org)) return "";
    if (!config.updateFormUrl || !orgId) return "";
    const base = String(config.updateFormUrl).trim();
    if (!base) return "";
    try {
      const url = new URL(base, window.location.origin);
      url.searchParams.set("org", orgId);
      return url.toString();
    } catch {
      return "";
    }
  }

  function renderModalEditAction(org) {
    const href = organizationUpdateFormUrl(org?.id);
    if (!href) return '';
    return `<a href="${escapeHtml(href)}" class="fides-modal-copy-link fides-modal-edit-link" aria-label="Suggest an update" title="Suggest an update">${icons.pencil}</a>`;
  }

  function officialProfileUrl(orgId) {
    syncCatalogConfig();
    const base = String(config.plansUrl || '').trim();
    if (!base || !orgId) return '';
    try {
      const url = new URL(base, window.location.origin);
      url.searchParams.set('org', orgId);
      url.searchParams.set('intent', 'official-profile');
      return url.toString();
    } catch {
      return '';
    }
  }

  function renderOrganizationOfficialProfileCta(org) {
    syncCatalogConfig();
    if (!config.showOfficialProfileCta) return '';
    if (!tierUiEnabled() || !orgCatalogTierIsCommunity(org)) return '';
    const href = officialProfileUrl(org?.id);
    if (!href) return '';
    return `
      <div class="fides-modal-footer fides-org-official-profile-cta">
        <div class="fides-org-official-profile-cta__copy">
          <strong>Is this your organisation?</strong>
          <span>Manage your catalog presence and show where your organisation is active.</span>
        </div>
        <a href="${escapeHtml(href)}" class="fides-org-official-profile-cta__link"
           data-matomo-name="Manage organization profile with a Pro Plan">
          Manage your profile with a Pro Plan <span aria-hidden="true">→</span>
        </a>
      </div>
    `;
  }

  function buildRatingsEndpoint(path, params) {
    if (!RATINGS_API_BASE) return '';
    const cleanedPath = String(path || '').replace(/^\/+/, '');
    const url = `${RATINGS_API_BASE}/${cleanedPath}`;
    const search = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v === null || v === undefined) return;
      const value = String(v).trim();
      if (!value) return;
      search.set(k, value);
    });
    const qs = search.toString();
    return qs ? `${url}?${qs}` : url;
  }

  function ratingMapForType(type) {
    return ratingSummariesByType[type] || null;
  }

  function setRatingSummaryForType(type, itemId, summary) {
    const map = ratingMapForType(type);
    if (!map || !itemId) return;
    const likes = Number(summary && summary.likes != null ? summary.likes : summary && summary.count != null ? summary.count : 0);
    const myLike = Number(summary && summary.my_like != null ? summary.my_like : summary && summary.my_rating != null ? summary.my_rating : 0);
    map[itemId] = {
      likes: Number.isFinite(likes) ? Math.max(0, Math.round(likes)) : 0,
      myLike: Number.isFinite(myLike) ? myLike : 0,
    };
  }

  function likeSummaryForType(type, itemId) {
    const map = ratingMapForType(type);
    if (!map || !itemId || !map[itemId]) return null;
    return map[itemId];
  }

  function renderModalEntityLikeInline(type, itemId) {
    const summary = likeSummaryForType(type, itemId);
    const count = summary ? Number(summary.likes || 0) : 0;
    if (!Number.isFinite(count) || count < 1) return '';
    return `<span class="fides-modal-entity-like-inline" aria-label="${count} likes"><span class="fides-modal-entity-like-star" aria-hidden="true">★</span>${count}</span>`;
  }

  function chunkArray(items, size) {
    const out = [];
    for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
    return out;
  }

  async function loadRatingSummariesForType(type, ids) {
    if (!RATINGS_API_BASE || !type || !Array.isArray(ids) || ids.length === 0) return;
    const uniqueIds = [...new Set(ids.map((id) => String(id || '').trim()).filter(Boolean))];
    if (uniqueIds.length === 0) return;
    const chunks = chunkArray(uniqueIds, RATINGS_BATCH_LIMIT);
    await Promise.all(chunks.map(async (chunk) => {
      const endpoint = buildRatingsEndpoint('batch', { type, ids: chunk.join(',') });
      if (!endpoint) return;
      try {
        const response = await fetch(endpoint);
        if (!response.ok) return;
        const data = await response.json();
        const results = data && data.results ? data.results : {};
        Object.keys(results).forEach((itemId) => {
          setRatingSummaryForType(type, itemId, results[itemId]);
        });
      } catch (_) {
        // Keep modal usable even when ratings endpoint is unreachable.
      }
    }));
  }

  function applyModalEntityLikes(overlay) {
    if (!overlay) return;
    overlay.querySelectorAll('[data-entity-like-type][data-entity-like-id]').forEach((node) => {
      const type = node.getAttribute('data-entity-like-type') || '';
      const itemId = node.getAttribute('data-entity-like-id') || '';
      node.innerHTML = renderModalEntityLikeInline(type, itemId);
    });
  }

  async function loadAndApplyModalRoleLikes(org) {
    if (!org || !RATINGS_API_BASE) return;
    const r = org.ecosystemRoles || {};
    const issuerIds = (r.issuers || []).map((x) => x && x.id).filter(Boolean);
    const credentialIds = (r.credentialTypes || []).map((x) => x && x.id).filter(Boolean);
    const walletIds = [...(r.personalWallets || []), ...(r.businessWallets || [])].map((x) => x && x.id).filter(Boolean);
    const rpIds = (r.relyingParties || []).map((x) => x && x.id).filter(Boolean);
    const useCaseIds = getDerivedUseCasesForOrg(org).map((x) => x && x.id).filter(Boolean);

    await Promise.all([
      loadRatingSummariesForType('issuer', issuerIds),
      loadRatingSummariesForType('credential', credentialIds),
      loadRatingSummariesForType('wallet', walletIds),
      loadRatingSummariesForType('rp', rpIds),
      loadRatingSummariesForType('usecase', useCaseIds),
    ]);

    applyModalEntityLikes(document.getElementById('fides-modal-overlay'));
  }

  const SORT_STORAGE_KEY = 'fides-org-sort';
  const SORT_OPTIONS = ['name', 'country', 'updatedAt'];
  const DEFAULT_SORT = 'updatedAt';

  function readStoredSort() {
    try {
      const v = localStorage.getItem(SORT_STORAGE_KEY);
      if (v && SORT_OPTIONS.includes(v)) return v;
    } catch {
      /* ignore */
    }
    return DEFAULT_SORT;
  }

  let organizations = [];
  let useCasesByOrgId = Object.create(null);
  let sortBy = readStoredSort();
  let selectedOrg = null;
  let forcedModalTheme = null;
  let root;
  let viewMode = localStorage.getItem('fides-org-view') || 'grid';
  const LIST_BREAKPOINT = 1024;
  function effectiveView() {
    return window.innerWidth < LIST_BREAKPOINT ? 'grid' : viewMode;
  }

  let mobileFiltersController = null;
  function getMobileFilters() {
    if (mobileFiltersController) return mobileFiltersController;
    if (!window.FidesCatalogUI || typeof window.FidesCatalogUI.createMobileFiltersController !== 'function') {
      return null;
    }
    mobileFiltersController = window.FidesCatalogUI.createMobileFiltersController({
      root: () => root,
      breakpoint: LIST_BREAKPOINT,
    });
    return mobileFiltersController;
  }

  let _lastOrgEffectiveView = effectiveView();
  window.addEventListener('resize', () => {
    if (!root) return;
    getMobileFilters()?.onLeavingMobileViewport();
    const cur = effectiveView();
    if (cur !== _lastOrgEffectiveView) {
      _lastOrgEffectiveView = cur;
      renderOrgGridOnly();
    }
  });

  const filterGroupState = { country: false, role: true, sector: false, certification: false };

  /** Per-parent expand state for nested certification sub-options (e.g. qtsp trust services). */
  const certSubExpanded = {};

  let filters = {
    search: '',
    country: [],
    role: [],
    sector: [],
    certification: [],
    manifestoSupporter: [],
    verifiedProfile: [],
    officialOnly: false,
    ids: [],
  };

  /** True when aggregated.json includes crawler-written bluePages.profileAvailable. */
  function orgBluePagesProfileKnownInData(org) {
    return Boolean(
      org && org.bluePages && Object.prototype.hasOwnProperty.call(org.bluePages, 'profileAvailable'),
    );
  }

  /**
   * Whether to show the Blue Pages list badge on cards (crawler API when present; else DID + REST).
   */
  function orgShowsBluePagesListBadge(org) {
    if (!org || !orgCatalogDid(org) || !config.bluePagesRestUrl) return false;
    if (orgBluePagesProfileKnownInData(org)) {
      return org.bluePages.profileAvailable === true;
    }
    return true;
  }

  /**
   * Verified profile accordion in modal (and REST load). Hidden when crawler marked DID absent from API.
   */
  function orgHasVerifiedProfileAccordion(org) {
    if (!org || !orgCatalogDid(org) || !config.bluePagesRestUrl) return false;
    if (orgBluePagesProfileKnownInData(org) && org.bluePages.profileAvailable === false) return false;
    return true;
  }

  /** Whether org has QTSP certification in the catalog payload. */
  function orgHasQtspBadge(org) {
    return orgCertificationCodes(org).includes('qtsp');
  }

  /** Whether org has a DIACC PCTF certification in the catalog payload. */
  function orgHasDiaccBadge(org) {
    return orgCertificationCodes(org).includes('diacc');
  }

  const OFFICIAL_ACCOUNT_TITLE = 'Official account — claimed by the organization';

  /** Grid card: listing badge + outline badges bottom-left in footer (quiet, no fill). */
  function renderOrgCardFooterBadges(org) {
    const parts = [];

    if (tierUiEnabled() && window.FidesCatalogUI && typeof window.FidesCatalogUI.buildCatalogListingHeaderBadgeHtml === 'function') {
      const listingBadge = window.FidesCatalogUI.buildCatalogListingHeaderBadgeHtml(org, {
        tierUiEnabled: tierUiEnabled(),
        editAccess: config.editAccess,
      });
      if (listingBadge) parts.push(listingBadge);
    } else if (orgCatalogTierIsPro(org)) {
      parts.push(`<span class="fides-org-footer-badge fides-org-footer-badge--official" role="img" aria-label="Official account" title="${OFFICIAL_ACCOUNT_TITLE}">${icons.official}</span>`);
    }

    if (orgHasQtspBadge(org)) {
      parts.push(`<span class="fides-org-footer-badge fides-org-footer-badge--qtsp" role="img" aria-label="EU Qualified Trust Service Provider (eIDAS)" title="EU Qualified Trust Service Provider (eIDAS)">${icons.qtsp}</span>`);
    }
    if (orgHasDiaccBadge(org)) {
      parts.push(`<span class="fides-org-footer-badge fides-org-footer-badge--diacc" role="img" aria-label="DIACC Certified (PCTF)" title="DIACC Certified (PCTF)">${icons.diacc}</span>`);
    }
    if (parts.length === 0) return '';
    const listingClass = tierUiEnabled() ? ' fides-org-card-footer-listing' : '';
    return `<div class="fides-org-card-footer-badges${listingClass}">${parts.join('')}</div>`;
  }

  /** List row: compact status icons next to flag (not on logo). Empty string when none — avoids extra flex gap. */
  function renderOrgListBadges(org) {
    const parts = [];
    if (orgCatalogTierIsPro(org)) {
      parts.push(`<span class="fides-row-badge-icon fides-row-badge-icon--official" role="img" aria-label="Official account" title="${OFFICIAL_ACCOUNT_TITLE}">${icons.official}</span>`);
    }
    if (org.fidesManifestoSupporter === true) {
      parts.push(`<span class="fides-row-badge-icon fides-row-badge-icon--manifesto" role="img" aria-label="FIDES Supporter" title="FIDES Supporter">${icons.community}</span>`);
    }
    if (orgShowsBluePagesListBadge(org)) {
      parts.push(`<span class="fides-row-badge-icon fides-row-badge-icon--bp" role="img" aria-label="Blue Pages verified profile available" title="Blue Pages verified profile available">${icons.shield}</span>`);
    }
    if (orgHasQtspBadge(org)) {
      parts.push(`<span class="fides-row-badge-icon fides-row-badge-icon--qtsp" role="img" aria-label="EU Qualified Trust Service Provider (eIDAS)" title="EU Qualified Trust Service Provider (eIDAS)">${icons.qtsp}</span>`);
    }
    if (orgHasDiaccBadge(org)) {
      parts.push(`<span class="fides-row-badge-icon fides-row-badge-icon--diacc" role="img" aria-label="DIACC Certified (PCTF)" title="DIACC Certified (PCTF)">${icons.diacc}</span>`);
    }
    if (parts.length === 0) return '';
    return `<div class="fides-row-badges">${parts.join('')}</div>`;
  }

  function orgCardAriaLabel(org, forListView) {
    const name = escapeHtml(org.name);
    const bits = [];
    if (orgCatalogTierIsPro(org)) bits.push('official account');
    if (forListView && orgShowsBluePagesListBadge(org)) bits.push('has Blue Pages verified profile');
    if (forListView && org && org.fidesManifestoSupporter === true) bits.push('FIDES Supporter');
    if (orgHasQtspBadge(org)) bits.push('qualified trust service provider');
    if (orgHasDiaccBadge(org)) bits.push('DIACC certified');
    if (bits.length === 0) return name;
    return `${name}, ${bits.join(', ')}`;
  }

  let settings;

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  const CERTIFICATION_LABELS = {
    iso27001: 'ISO 27001',
    iso27701: 'ISO 27701',
    qtsp: 'QTSP (eIDAS)',
    soc2: 'SOC 2',
    diacc: 'DIACC Certified',
  };

  const DIACC_COMPONENT_LABELS = {
    digital_wallet: 'Digital Wallet',
    verified_person: 'Verified Person',
    privacy: 'Privacy',
  };

  const DIACC_COMPONENT_ORDER = {
    digital_wallet: 0,
    verified_person: 1,
    privacy: 2,
  };

  const SECTOR_LABELS = {
    public_sector: 'Public Sector',
    finance: 'Finance',
    trade: 'Trade',
    supply_chain: 'Supply Chain',
    manufacturing: 'Manufacturing',
    energy: 'Energy',
    agriculture: 'Agriculture',
    food: 'Food',
    retail: 'Retail',
    healthcare: 'Healthcare',
    education: 'Education',
    construction: 'Construction',
    mobility: 'Mobility',
    digital: 'Digital',
  };

  /** Sector filter checkboxes: alphabetical by display label (English). */
  const SECTOR_CODES_ALPHABETIC = Object.keys(SECTOR_LABELS).sort((a, b) =>
    SECTOR_LABELS[a].localeCompare(SECTOR_LABELS[b], 'en', { sensitivity: 'base' }),
  );

  const ECOSYSTEM_ROLE_OPTIONS = [
    { value: 'personal_wallet_provider', label: 'Personal Wallet Provider' },
    { value: 'business_wallet_provider', label: 'Business Wallet Provider' },
    { value: 'vc_type_authority', label: 'VC Type Authority' },
    { value: 'issuer', label: 'Issuer' },
    { value: 'relying_party', label: 'Relying Party' },
    { value: 'idv_provider', label: 'IDV Provider' },
    { value: 'kyb_provider', label: 'KYB Provider' },
    { value: 'system_integrator', label: 'System Integrator' },
    { value: 'consultancy', label: 'Consultancy' },
    { value: 'software_vendor', label: 'Software Vendor' },
    { value: 'business_registry', label: 'Business Registry' },
    { value: 'industry_association', label: 'Industry Association' },
    { value: 'standards_development_organization', label: 'Standards Development Organization (SDO)' },
    { value: 'conformity_scheme_owner', label: 'Conformity Scheme Owner' },
    { value: 'national_accreditation_body', label: 'National Accreditation Body (NAB)' },
    { value: 'certification_body', label: 'Certification Body (CB)' },
    { value: 'conformity_assessment_body', label: 'Conformity Assessment Body (CAB)' },
    { value: 'eudi_wallet_intermediary', label: 'EUDI Wallet Intermediary' },
    { value: 'eidas_trust_service_provider', label: 'eIDAS Trust Service Provider' },
    { value: 'trust_infrastructure_provider', label: 'Trust Infrastructure Provider' },
    { value: 'interop_testbed_operator', label: 'Interop Testbed Operator' },
  ];

  const ECOSYSTEM_ROLE_LABELS = Object.fromEntries(
    ECOSYSTEM_ROLE_OPTIONS.map((opt) => [opt.value, opt.label]),
  );

  const LEGACY_SECTOR_TO_CANONICAL = {
    government: 'public_sector',
    finance: 'finance',
    healthcare: 'healthcare',
    education: 'education',
    retail: 'retail',
    travel: 'mobility',
    hospitality: 'retail',
    employment: 'digital',
    telecom: 'digital',
    utilities: 'energy',
    insurance: 'finance',
    'real-estate': 'construction',
    automotive: 'mobility',
    entertainment: 'retail',
    other: 'digital',
  };

  function normalizeSectorFilterCode(code) {
    if (!code || typeof code !== 'string') return '';
    const t = code.trim().toLowerCase();
    if (!t) return '';
    if (Object.prototype.hasOwnProperty.call(SECTOR_LABELS, t)) return t;
    const mapped = LEGACY_SECTOR_TO_CANONICAL[t];
    if (mapped && Object.prototype.hasOwnProperty.call(SECTOR_LABELS, mapped)) return mapped;
    return '';
  }

  /** ISO 3166-1 alpha-2 for ?country= (country explorer deep links). */
  function normalizeCountryFilterCode(raw) {
    if (raw == null || typeof raw !== 'string') return '';
    const s = String(raw).trim().replace(/[^a-z]/gi, '').toUpperCase();
    return s.length === 2 ? s : '';
  }

  /** Canonical sector codes for an org (URL filter, facets, and JSON may use mixed case or legacy labels). */
  function orgSectorCodes(org) {
    const raw = org && org.sectors;
    if (!Array.isArray(raw)) return [];
    const seen = new Set();
    const out = [];
    raw.forEach((s) => {
      if (typeof s !== 'string') return;
      const c = normalizeSectorFilterCode(s);
      if (c && !seen.has(c)) {
        seen.add(c);
        out.push(c);
      }
    });
    return out;
  }

  function offeringsSearchHaystack(org) {
    const raw = org.offerings;
    if (!Array.isArray(raw) || raw.length === 0) return '';
    return raw
      .filter((item) => typeof item === 'string' && item.trim())
      .join(' ')
      .toLowerCase();
  }

  /** Community listing when tier UI is on (inverse of orgCatalogTierIsPro, incl. proOrgIds fallback). */
  function orgCatalogTierIsCommunity(org) {
    if (!tierUiEnabled()) return false;
    if (!org) return false;
    return !orgCatalogTierIsPro(org);
  }

  function orgIdInProOrgIds(orgId) {
    const id = String(orgId || '').trim();
    if (!id) return false;
    syncCatalogConfig();
    const access = config.editAccess && typeof config.editAccess === 'object' ? config.editAccess : null;
    const proOrgIds = Array.isArray(access && access.proOrgIds) ? access.proOrgIds : [];
    return proOrgIds.indexOf(id) >= 0;
  }

  /** Official (Pro): explicit catalogTier Pro, or linked account in proOrgIds when tier field is absent. */
  function orgCatalogTierIsPro(org) {
    if (!tierUiEnabled()) return false;
    if (!org) return false;
    if (org.catalogTier) {
      const tier = String(org.catalogTier).toLowerCase();
      return tier !== 'gratis' && tier !== 'community';
    }
    return orgIdInProOrgIds(org.id);
  }

  function orgOfficialCardClass(org) {
    return orgCatalogTierIsPro(org) ? ' fides-org-card--official' : '';
  }

  function orgWebsiteHref(website) {
    const raw = typeof website === 'string' ? website.trim() : '';
    return raw;
  }

  function orgWebsiteLabel(website) {
    const href = orgWebsiteHref(website);
    if (!href) return '';
    return href.replace(/^https?:\/\//i, '').replace(/\/$/, '');
  }

  /** Country + website link under the modal title (website for Official accounts only). */
  function renderOrganizationModalHeaderMeta(org) {
    const countryPart = org.country ? renderOrgCountryMeta(org) : '';
    const websiteHref = tierUiEnabled()
      ? (orgCatalogTierIsPro(org) ? orgWebsiteHref(org.website) : '')
      : orgWebsiteHref(org.website);
    const websitePart = websiteHref
      ? `<a href="${escapeHtml(websiteHref)}" target="_blank" rel="noopener" class="fides-modal-provider-link fides-modal-header-website" onclick="event.stopPropagation();">${icons.externalLink} <span class="fides-url-ellipsis">${escapeHtml(orgWebsiteLabel(org.website))}</span></a>`
      : '';
    const supporterPart = org.fidesManifestoSupporter === true
      ? `<span class="fides-org-footer-badge fides-org-footer-badge--manifesto fides-modal-header-meta-badge" role="img" aria-label="FIDES Supporter" title="FIDES Supporter">${icons.community}</span>`
      : '';
    const parts = [countryPart, websitePart, supporterPart].filter(Boolean);
    if (parts.length === 0) return '';
    return `<p class="fides-modal-provider fides-modal-provider--org">${parts.join('<span class="fides-modal-header-meta-sep" aria-hidden="true">·</span>')}</p>`;
  }

  function orgEcosystemRoleLabels(org) {
    return orgEcosystemRoleCodes(org)
      .map((code) => ECOSYSTEM_ROLE_LABELS[code] || code)
      .sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
  }

  function renderOrganizationModalAboutBody(org) {
    const isCommunity = orgCatalogTierIsCommunity(org);
    const codes = orgSectorCodes(org);
    const sectorLabels = codes
      .map((c) => SECTOR_LABELS[c] || c)
      .sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
    const sectorInner = sectorLabels.map((l) => `<span class="fides-tag">${escapeHtml(l)}</span>`).join('');
    const ecosystemRoleLabels = orgEcosystemRoleLabels(org);
    const ecosystemRolesInner = ecosystemRoleLabels
      .map((l) => `<span class="fides-tag fides-tag--ecosystem-role">${escapeHtml(l)}</span>`)
      .join('');
    const rawTags = Array.isArray(org.tags) ? org.tags : [];
    const tagStrings = rawTags.filter((t) => typeof t === 'string' && t.trim()).map((t) => t.trim());
    const sortedTags = tagStrings.slice().sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
    const tagsInner = sortedTags.map((t) => `<span class="fides-tag">${escapeHtml(t)}</span>`).join('');
    const rawOfferings = Array.isArray(org.offerings) ? org.offerings : [];
    const offeringStrings = rawOfferings.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim());
    const sortedOfferings = offeringStrings.slice().sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
    const offeringsInner = sortedOfferings.map((item) => `<span class="fides-tag fides-tag--offering">${escapeHtml(item)}</span>`).join('');
    return `
      <div class="fides-modal-taxonomy fides-modal-taxonomy--org-overview">
        <div class="fides-modal-taxonomy-row">
          <span class="fides-modal-taxonomy-label">${icons.tag} Sectors</span>
          <div class="fides-modal-taxonomy-tags">${sectorInner || '<span class="fides-modal-taxonomy-empty">\u2014</span>'}</div>
        </div>
        ${ecosystemRoleLabels.length ? `<div class="fides-modal-taxonomy-row"><span class="fides-modal-taxonomy-label">${icons.share} Ecosystem roles</span><div class="fides-modal-taxonomy-tags">${ecosystemRolesInner}</div></div>` : ''}
        ${!isCommunity && tagsInner ? `<div class="fides-modal-taxonomy-row"><span class="fides-modal-taxonomy-label">${icons.tag} Tags</span><div class="fides-modal-taxonomy-tags">${tagsInner}</div></div>` : ''}
        ${!isCommunity && offeringsInner ? `<div class="fides-modal-taxonomy-row"><span class="fides-modal-taxonomy-label">${icons.offerings} Offerings</span><div class="fides-modal-taxonomy-tags">${offeringsInner}</div></div>` : ''}
      </div>
    `;
  }

  function orgCertificationCodes(org) {
    const raw = org.certifications;
    if (!Array.isArray(raw)) return [];
    return raw
      .map((c) => (c && typeof c === 'object' && typeof c.code === 'string' ? c.code : null))
      .filter(Boolean);
  }

  function certificationsSearchHaystack(org) {
    const raw = org.certifications;
    if (!Array.isArray(raw) || raw.length === 0) return '';
    const bits = [];
    for (const c of raw) {
      if (!c || typeof c !== 'object' || typeof c.code !== 'string') continue;
      bits.push(c.code);
      const ev = c.evidence;
      if (!ev || typeof ev !== 'object') continue;
      if (ev.kind === 'url') {
        if (ev.url) bits.push(ev.url);
        if (ev.label) bits.push(ev.label);
      } else if (ev.kind === 'verifiable_credential') {
        if (ev.credentialUri) bits.push(ev.credentialUri);
        if (ev.format) bits.push(ev.format);
        if (ev.notes) bits.push(ev.notes);
      }
      const details = c.details;
      if (details && typeof details === 'object' && Array.isArray(details.trustServices)) {
        details.trustServices.forEach((svc) => {
          if (!svc || typeof svc !== 'object') return;
          if (typeof svc.code === 'string') bits.push(svc.code);
          if (typeof svc.name === 'string') bits.push(svc.name);
          const shortLabel = qtspTrustServiceLabel(svc);
          const longLabel = qtspTrustServiceTitle(svc);
          if (shortLabel) bits.push(shortLabel);
          if (longLabel) bits.push(longLabel);
        });
      }
      if (details && typeof details === 'object' && Array.isArray(details.components)) {
        details.components.forEach((comp) => {
          if (!comp || typeof comp !== 'object') return;
          if (typeof comp.component === 'string') bits.push(comp.component);
          if (typeof comp.loa === 'string') bits.push(comp.loa);
          bits.push(diaccComponentTitle(comp));
          const cev = comp.evidence;
          if (cev && typeof cev === 'object') {
            if (cev.kind === 'url' && cev.url) bits.push(cev.url);
            if (cev.kind === 'verifiable_credential' && cev.credentialUri) bits.push(cev.credentialUri);
          }
        });
      }
    }
    return bits.join(' ').toLowerCase();
  }

  function orgQtspTrustServices(org) {
    const raw = Array.isArray(org?.certifications) ? org.certifications : [];
    const qtsp = raw.find((c) => c && typeof c === 'object' && c.code === 'qtsp');
    const details = qtsp && typeof qtsp === 'object' ? qtsp.details : null;
    const list = details && Array.isArray(details.trustServices) ? details.trustServices : [];
    const normalized = list
      .filter((svc) => svc && typeof svc === 'object' && typeof svc.code === 'string' && svc.code.trim())
      .map((svc) => ({
        code: svc.code.trim(),
        name: typeof svc.name === 'string' && svc.name.trim() ? svc.name.trim() : '',
      }))
      .sort((a, b) => a.code.localeCompare(b.code));
    return normalized;
  }

  const QTSP_TRUST_SERVICE_ABBREVIATIONS = {
    Q_CERT_ESIG: 'QESig',
    Q_CERT_ESEAL: 'QESeal',
    Q_TIMESTAMP: 'QTimestamp',
    Q_ERDS: 'QERDS',
    Q_WAC: 'QWAC',
    Q_EARCH: 'QEArch',
    Q_VC: 'QVal',
    Q_PRES: 'QPres',
    Q_PRES_ESEAL: 'QPresSeal',
    Q_PRES_ESIG: 'QPresSig',
    Q_VAL_ESEAL: 'QValSeal',
    Q_VAL_ESIG: 'QValSig',
    Q_REM_MANAGE_Q_SEAL_CD: 'QRemSeal',
    Q_REM_MANAGE_Q_SIG_CD: 'QRemSig',
    QEAA: 'QEAA',
  };

  const QTSP_TRUST_SERVICE_FULL_LABELS = {
    Q_CERT_ESIG: 'Qualified electronic signature certificate',
    Q_CERT_ESEAL: 'Qualified electronic seal certificate',
    Q_TIMESTAMP: 'Qualified timestamp',
    Q_ERDS: 'Qualified electronic registered delivery service',
    Q_WAC: 'Qualified website authentication certificate',
    Q_EARCH: 'Qualified electronic archiving',
    Q_VC: 'Qualified validation service',
    Q_PRES: 'Qualified preservation service',
    Q_PRES_ESEAL: 'Qualified preservation service for electronic seals',
    Q_PRES_ESIG: 'Qualified preservation service for electronic signatures',
    Q_VAL_ESEAL: 'Qualified validation service for electronic seals',
    Q_VAL_ESIG: 'Qualified validation service for electronic signatures',
    Q_REM_MANAGE_Q_SEAL_CD: 'Qualified management of remote seal creation devices',
    Q_REM_MANAGE_Q_SIG_CD: 'Qualified management of remote signature creation devices',
    QEAA: 'Qualified electronic attestation of attributes',
  };
  const QTSP_VISIBLE_TRUST_SERVICES = 4;

  function qtspTrustServiceLabel(service) {
    const code = String(service?.code || '').trim();
    if (code && QTSP_TRUST_SERVICE_ABBREVIATIONS[code]) return QTSP_TRUST_SERVICE_ABBREVIATIONS[code];
    if (code) return code.replace(/^Q_/, 'Q-').replace(/_/g, '-');
    return '';
  }

  function qtspTrustServiceTitle(service) {
    const code = String(service?.code || '').trim();
    if (code && QTSP_TRUST_SERVICE_FULL_LABELS[code]) return QTSP_TRUST_SERVICE_FULL_LABELS[code];
    const name = String(service?.name || '').trim();
    if (name) return name;
    return code;
  }

  /** Normalized DIACC PCTF certified components for an org (sorted by canonical order). */
  function orgDiaccComponents(org) {
    const raw = Array.isArray(org?.certifications) ? org.certifications : [];
    const diacc = raw.find((c) => c && typeof c === 'object' && c.code === 'diacc');
    const details = diacc && typeof diacc === 'object' ? diacc.details : null;
    const list = details && Array.isArray(details.components) ? details.components : [];
    return list
      .filter((comp) => comp && typeof comp === 'object' && typeof comp.component === 'string' && comp.component.trim())
      .map((comp) => ({
        component: comp.component.trim(),
        loa: typeof comp.loa === 'string' && comp.loa.trim() ? comp.loa.trim() : '',
        evidence: comp.evidence && typeof comp.evidence === 'object' ? comp.evidence : null,
      }))
      .sort((a, b) => (DIACC_COMPONENT_ORDER[a.component] ?? 99) - (DIACC_COMPONENT_ORDER[b.component] ?? 99));
  }

  function diaccComponentName(comp) {
    const key = String(comp?.component || '').trim();
    return DIACC_COMPONENT_LABELS[key] || key.replace(/_/g, ' ');
  }

  /** Full component label, e.g. "PCTF Digital Wallet Component at LOA3". */
  function diaccComponentTitle(comp) {
    const name = diaccComponentName(comp);
    const loa = String(comp?.loa || '').trim();
    return `PCTF ${name} Component${loa ? ` at ${loa}` : ''}`;
  }

  /** Child sub-option codes for a certification family (qtsp trust services / diacc components), as a Set. */
  function orgCertificationChildCodes(org, code) {
    if (code === 'qtsp') return new Set(orgQtspTrustServices(org).map((s) => s.code));
    if (code === 'diacc') return new Set(orgDiaccComponents(org).map((c) => c.component));
    return new Set();
  }

  /** Namespaced certification sub-values for an org, e.g. 'qtsp:QEAA', 'diacc:privacy'. */
  function orgCertificationSubValues(org) {
    const out = [];
    for (const svc of orgQtspTrustServices(org)) out.push(`qtsp:${svc.code}`);
    for (const comp of orgDiaccComponents(org)) out.push(`diacc:${comp.component}`);
    return out;
  }

  /** Display label for a certification sub-option. */
  function certificationSubLabel(parentCode, childCode) {
    if (parentCode === 'qtsp') {
      if (QTSP_TRUST_SERVICE_FULL_LABELS[childCode]) return QTSP_TRUST_SERVICE_FULL_LABELS[childCode];
      // Fallback: readable hyphenated/abbreviated form, never the raw underscored code.
      return qtspTrustServiceLabel({ code: childCode }) || childCode;
    }
    if (parentCode === 'diacc') return DIACC_COMPONENT_LABELS[childCode] || String(childCode).replace(/_/g, ' ');
    return childCode;
  }

  /** Ordered, de-duplicated child option codes for a parent across all loaded orgs. */
  function certificationChildOptions(parentCode) {
    const set = new Set();
    for (const org of organizations) {
      for (const child of orgCertificationChildCodes(org, parentCode)) set.add(child);
    }
    const arr = [...set];
    if (parentCode === 'diacc') {
      arr.sort((a, b) => (DIACC_COMPONENT_ORDER[a] ?? 99) - (DIACC_COMPONENT_ORDER[b] ?? 99));
    } else {
      arr.sort((a, b) => certificationSubLabel(parentCode, a).localeCompare(certificationSubLabel(parentCode, b), 'en', { sensitivity: 'base' }));
    }
    return arr;
  }

  /**
   * Certification filter semantics:
   * - OR across different families (e.g. qtsp OR diacc).
   * - Within a family: if any sub-option is selected, the org must have that
   *   family AND at least one of the selected sub-options. A parent-only
   *   selection (no sub-options) matches any org that has the family.
   */
  function orgMatchesCertificationFilter(org) {
    const sel = filters.certification;
    if (!sel.length) return true;
    const families = {};
    for (const v of sel) {
      const idx = v.indexOf(':');
      if (idx === -1) {
        families[v] = families[v] || { children: new Set() };
      } else {
        const code = v.slice(0, idx);
        const child = v.slice(idx + 1);
        (families[code] = families[code] || { children: new Set() }).children.add(child);
      }
    }
    const orgCodes = orgCertificationCodes(org);
    for (const code of Object.keys(families)) {
      if (!orgCodes.includes(code)) continue;
      const fam = families[code];
      if (fam.children.size === 0) return true;
      const orgChildren = orgCertificationChildCodes(org, code);
      for (const child of fam.children) {
        if (orgChildren.has(child)) return true;
      }
    }
    return false;
  }

  /** Count of valid catalog certification entries (same rules as renderCertificationsAccordionBody). */
  function countCatalogCertifications(org) {
    const raw = org.certifications;
    if (!Array.isArray(raw)) return 0;
    let n = 0;
    for (const c of raw) {
      if (!c || typeof c !== 'object' || typeof c.code !== 'string') continue;
      n += 1;
    }
    return n;
  }

  /** Body HTML for the Certifications accordion (catalog declarations: ISO, SOC2, etc.). */
  function renderCertificationsAccordionBody(org) {
    const raw = org.certifications;
    const lines = [];
    if (Array.isArray(raw)) {
      for (const c of raw) {
        if (!c || typeof c !== 'object' || typeof c.code !== 'string') continue;
        const title = CERTIFICATION_LABELS[c.code] || c.code;
        let extra = '';
        const ev = c.evidence;
        if (ev && typeof ev === 'object' && ev.kind === 'url' && ev.url) {
          const linkLabel = c.code === 'qtsp'
            ? 'EU eIDAS Trust List'
            : ((ev.label && String(ev.label).trim()) || 'Documentation');
          extra = ` <a href="${escapeHtml(ev.url)}" class="fides-modal-link-inline" target="_blank" rel="noopener" onclick="event.stopPropagation();">${escapeHtml(linkLabel)} ${icons.externalLink}</a>`;
        } else if (ev && typeof ev === 'object' && ev.kind === 'verifiable_credential' && ev.credentialUri) {
          const fmt = ev.format ? String(ev.format) : 'Credential';
          extra = ` <a href="${escapeHtml(ev.credentialUri)}" class="fides-modal-link-inline" target="_blank" rel="noopener" onclick="event.stopPropagation();">${escapeHtml(fmt)} VC ${icons.externalLink}</a>`;
          if (ev.notes && String(ev.notes).trim()) {
            extra += ` <span class="fides-org-cert-notes">${escapeHtml(String(ev.notes).trim())}</span>`;
          }
        }
        let trustServicesHtml = '';
        if (c.code === 'qtsp') {
          const trustServices = orgQtspTrustServices(org);
          if (trustServices.length > 0) {
            const visible = trustServices.slice(0, QTSP_VISIBLE_TRUST_SERVICES);
            const remaining = trustServices.length - visible.length;
            const allLabels = trustServices
              .map((svc) => qtspTrustServiceTitle(svc))
              .filter(Boolean)
              .join(', ');
            const tags = visible
              .map((svc) => {
                const label = qtspTrustServiceLabel(svc) || svc.code;
                const tooltip = qtspTrustServiceTitle(svc) ? ` title="${escapeHtml(qtspTrustServiceTitle(svc))}"` : '';
                return `<span class="fides-tag fides-tag--cert fides-tag--qtsp-service"${tooltip}>${escapeHtml(label)}</span>`;
              })
              .join('');
            const moreTags = remaining > 0
              ? trustServices
                .slice(QTSP_VISIBLE_TRUST_SERVICES)
                .map((svc) => {
                  const label = qtspTrustServiceLabel(svc) || svc.code;
                  const tooltip = qtspTrustServiceTitle(svc) ? ` title="${escapeHtml(qtspTrustServiceTitle(svc))}"` : '';
                  return `<span class="fides-tag fides-tag--cert fides-tag--qtsp-service"${tooltip}>${escapeHtml(label)}</span>`;
                })
                .join('')
              : '';
            const moreTag = remaining > 0
              ? `<button type="button" class="fides-tag fides-tag--cert fides-tag--qtsp-service fides-tag--cert-muted fides-org-cert-more-toggle" title="${escapeHtml(allLabels)}">+${remaining}</button><span class="fides-org-cert-more-items" hidden>${moreTags}</span>`
              : '';
            trustServicesHtml = `<span class="fides-org-cert-trust-services-inline">${tags}${moreTag}</span>`;
          }
        }
        if (c.code === 'qtsp') {
          lines.push(`<div class="fides-org-cert-line"><span class="fides-tag fides-tag--cert fides-tag--qtsp-core">${escapeHtml(title)}</span>${trustServicesHtml}${extra}</div>`);
        } else if (c.code === 'diacc') {
          const components = orgDiaccComponents(org);
          const compHtml = components
            .map((comp) => {
              const label = diaccComponentTitle(comp);
              const cev = comp.evidence;
              let href = '';
              let proofTitle = '';
              if (cev && typeof cev === 'object' && cev.kind === 'url' && cev.url) {
                href = cev.url;
                proofTitle = (cev.label && String(cev.label).trim()) || 'View DIACC PCTF certificate (PDF)';
              } else if (cev && typeof cev === 'object' && cev.kind === 'verifiable_credential' && cev.credentialUri) {
                href = cev.credentialUri;
                proofTitle = 'View DIACC PCTF credential';
              }
              if (href) {
                return `<a href="${escapeHtml(href)}" class="fides-tag fides-tag--cert fides-tag--diacc-component fides-tag--diacc-proof" target="_blank" rel="noopener" title="${escapeHtml(proofTitle)}" onclick="event.stopPropagation();"><span class="fides-tag--diacc-proof-label">${escapeHtml(label)}</span><span class="fides-tag--diacc-proof-action"><span class="fides-tag--diacc-proof-icon" aria-hidden="true">${icons.shield}</span>Proof<span class="fides-tag--diacc-proof-ext" aria-hidden="true">${icons.externalLink}</span></span></a>`;
              }
              return `<span class="fides-tag fides-tag--cert fides-tag--diacc-component">${escapeHtml(label)}</span>`;
            })
            .join('');
          const componentsHtml = compHtml ? `<span class="fides-org-cert-diacc-components-inline">${compHtml}</span>` : '';
          lines.push(`<div class="fides-org-cert-line"><span class="fides-tag fides-tag--cert fides-tag--diacc-core">${escapeHtml(title)}</span>${componentsHtml}${extra}</div>`);
        } else {
          lines.push(`<div class="fides-org-cert-line"><span class="fides-tag fides-tag--cert">${escapeHtml(title)}</span>${extra}${trustServicesHtml}</div>`);
        }
      }
    }
    if (lines.length === 0) {
      return '<p class="fides-org-bluepages-empty">No certifications are listed in the catalog for this organization.</p>';
    }
    return `<div class="fides-org-cert-list">${lines.join('')}</div>`;
  }

  function debounce(fn, ms) {
    let timer;
    return function (...args) { clearTimeout(timer); timer = setTimeout(() => fn.apply(this, args), ms); };
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US');
  }

  function formatDateTimeIso(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  }

  const EINVOICE_LABELS = {
    entityName: 'Entity name',
    country: 'Country',
    documentIdentifiers: 'Document identifiers',
    processIdentifiers: 'Process identifiers',
    transportType: 'Transport type',
    peppolParticipantId: 'Peppol participant ID',
    peppolSmpUrl: 'Peppol SMP URL',
    peppolAs4Endpoint: 'Peppol AS4 endpoint',
  };

  function humaniseEinvoiceKey(key) {
    if (EINVOICE_LABELS[key]) return EINVOICE_LABELS[key];
    return String(key || '').replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim();
  }

  function normalizeEinvoiceServiceToAttributes(service) {
    const attributes = [];
    const rawData = service.rawData || {};
    const eInvoiceList = rawData.eInvoice;
    const method = rawData.eInvoiceMethod || '';
    attributes.push({ displayName: 'Type', value: service.serviceType || 'eInvoice' });
    attributes.push({ displayName: 'Method', value: method });
    attributes.push({ displayName: 'Endpoint', value: service.serviceEndpoint || '' });
    if (!Array.isArray(eInvoiceList)) return attributes;
    eInvoiceList.forEach((entry, index) => {
      if (!entry || typeof entry !== 'object') return;
      const prefix = eInvoiceList.length > 1 ? `Entry ${index + 1} – ` : '';
      Object.keys(entry).forEach((k) => {
        let val = entry[k];
        if (Array.isArray(val)) val = val.map((x) => String(x)).join('\n');
        attributes.push({ displayName: prefix + humaniseEinvoiceKey(k), value: String(val ?? '') });
      });
    });
    return attributes;
  }

  function escapeAttrMultiline(str) {
    return escapeHtml(String(str ?? '')).replace(/\n/g, '<br>');
  }

  function bluePagesProfileUrlForDid(did) {
    const base = (config.bluePagesProfileBaseUrl || '').replace(/\/?$/, '/');
    if (!base || !did) return '';
    return base + encodeURIComponent(did) + '/';
  }

  /** Hide upstream Java/API noise when the proxy still returns a raw message (older cache, etc.). */
  function bluePagesFriendlyErrorMessage(raw) {
    const s = String(raw || '').trim();
    if (!s) return 'Could not load Blue Pages data.';
    if (/illegalargumentexception|java\.lang\.|nosuchelementexception|nullpointerexception/i.test(s)) {
      return 'This DID is not registered in Blue Pages yet. Verified credentials will appear after the organization completes Blue Pages registration.';
    }
    if (s.length > 200 || /[\r\n]/.test(s) || /<[a-z][\s/>]/i.test(s)) {
      return 'Blue Pages could not load this profile.';
    }
    return s;
  }

  function bluePagesBadgeClass(status) {
    const s = String(status || '').toLowerCase();
    if (s === 'valid') return 'fides-bp-badge fides-bp-badge--valid';
    if (s === 'invalid') return 'fides-bp-badge fides-bp-badge--invalid';
    if (s.includes('self')) return 'fides-bp-badge fides-bp-badge--self';
    return 'fides-bp-badge fides-bp-badge--neutral';
  }

  function renderBluePagesAttrRows(attributes) {
    if (!attributes || !attributes.length) {
      return '<p class="fides-org-bluepages-empty">No attributes.</p>';
    }
    const rows = attributes.map((attr) => {
      const label = escapeHtml(attr.displayName || '');
      let raw = attr.value != null ? String(attr.value) : '';
      if (raw.startsWith('data:image/')) return '';
      const isUrl = /^https?:\/\//i.test(raw.trim());
      const valInner = isUrl
        ? `<a href="${escapeHtml(raw.trim())}" target="_blank" rel="noopener" class="fides-modal-link-inline fides-url-ellipsis" onclick="event.stopPropagation();">${escapeHtml(raw.trim())} ${icons.externalLink}</a>`
        : `<span>${escapeAttrMultiline(raw)}</span>`;
      return `<div class="fides-kv-row"><span class="fides-kv-key">${label}</span><span class="fides-kv-val">${valInner}</span></div>`;
    }).filter(Boolean);
    if (!rows.length) {
      return '<p class="fides-org-bluepages-empty">No attributes.</p>';
    }
    return `<div class="fides-details-kv fides-org-bluepages-kv">${rows.join('')}</div>`;
  }

  /**
   * Build credential cards from Blue Pages validations payload (same shape as fides-blue-pages did-detail).
   */
  function renderBluePagesCredentials(data) {
    const services = data.services;
    if (!services || !Array.isArray(services) || services.length === 0) {
      return '<p class="fides-org-bluepages-empty">No verified credentials returned from Blue Pages.</p>';
    }
    const issuerBase = (config.bluePagesProfileBaseUrl || '').replace(/\/?$/, '/');
    const parts = [];

    services.forEach((value) => {
      const isEinvoice = (value.serviceType || '') === 'eInvoice' && value.rawData && Array.isArray(value.rawData.eInvoice);
      if (isEinvoice) {
        const method = value.rawData.eInvoiceMethod || '';
        const title = method ? `eInvoice (${method})` : 'eInvoice';
        const attrs = normalizeEinvoiceServiceToAttributes(value);
        parts.push(`
          <div class="fides-bp-credential" data-status="self">
            <div class="fides-bp-credential__bar">
              <h4 class="fides-bp-credential__title">${escapeHtml(title)}</h4>
              <span class="fides-bp-badge fides-bp-badge--self">Self-declared</span>
            </div>
            <div class="fides-bp-credential__body">${renderBluePagesAttrRows(attrs)}</div>
          </div>
        `);
      }

      const credentials = value.credentials || [];
      credentials.forEach((vc) => {
        const type = vc.displayName || 'Credential';
        const status = vc.status || '';
        const attrs = vc.attributes;
        const issuerDid = vc.issuerDid || '';
        let issuerLine = '';
        if (issuerDid) {
          const href = issuerBase ? issuerBase + encodeURIComponent(issuerDid) + '/' : '';
          const label = escapeHtml(issuerDid.length > 48 ? issuerDid.slice(0, 46) + '…' : issuerDid);
          issuerLine = href
            ? `<p class="fides-bp-credential__issuer"><span class="fides-bp-credential__issuer-label">Issued by:</span> <a href="${escapeHtml(href)}" class="fides-modal-link-inline" target="_blank" rel="noopener" onclick="event.stopPropagation();">${label} ${icons.externalLink}</a></p>`
            : `<p class="fides-bp-credential__issuer"><span class="fides-bp-credential__issuer-label">Issued by:</span> <span title="${escapeHtml(issuerDid)}">${label}</span></p>`;
        }
        const badgeClass = bluePagesBadgeClass(status);
        const badgeLabel = escapeHtml(status || '—');
        parts.push(`
          <div class="fides-bp-credential" data-status="${escapeHtml(String(status || '').toLowerCase())}">
            <div class="fides-bp-credential__bar">
              <div class="fides-bp-credential__headtext">
                <h4 class="fides-bp-credential__title">${escapeHtml(type)}</h4>
                ${issuerLine}
              </div>
              <span class="${badgeClass}">${badgeLabel}</span>
            </div>
            <div class="fides-bp-credential__body">${Array.isArray(attrs) ? renderBluePagesAttrRows(attrs) : '<p class="fides-org-bluepages-empty">No attributes.</p>'}</div>
          </div>
        `);
      });
    });

    return parts.length ? parts.join('') : '<p class="fides-org-bluepages-empty">No verified credentials returned from Blue Pages.</p>';
  }

  async function loadBluePagesSection(did) {
    const root = document.getElementById('fides-org-bluepages-root');
    if (!root || !did || !config.bluePagesRestUrl) return;

    const url = `${config.bluePagesRestUrl}?did=${encodeURIComponent(did)}`;
    try {
      const res = await fetch(url);
      const payload = await res.json();
      if (!payload.ok) {
        const errText = bluePagesFriendlyErrorMessage(payload.error || 'Could not load Blue Pages data.');
        root.innerHTML = `<p class="fides-org-bluepages-error">${escapeHtml(errText)}</p>
          <p class="fides-org-bluepages-retry-wrap"><button type="button" class="fides-org-bluepages-retry" data-did="${escapeHtml(did)}">Retry</button></p>`;
        const retry = root.querySelector('.fides-org-bluepages-retry');
        if (retry) retry.addEventListener('click', () => { root.innerHTML = '<p class="fides-org-bluepages-loading">Loading…</p>'; loadBluePagesSection(did); });
        return;
      }
      const data = payload.data || {};
      const fetchedAt = payload.fetchedAt ? `<p class="fides-org-bluepages__meta">Last checked: ${escapeHtml(formatDateTimeIso(payload.fetchedAt))}</p>` : '';
      const fullUrl = bluePagesProfileUrlForDid(did);
      const linkRow = fullUrl
        ? `<div class="fides-org-bluepages__head"><a href="${escapeHtml(fullUrl)}" class="fides-modal-link-inline" target="_blank" rel="noopener" onclick="event.stopPropagation();">Open full Blue Pages profile ${icons.externalLink}</a></div>`
        : '';
      root.innerHTML = `${linkRow}${fetchedAt}<div class="fides-org-bluepages-credentials">${renderBluePagesCredentials(data)}</div>`;
    } catch (err) {
      root.innerHTML = `<p class="fides-org-bluepages-error">${escapeHtml(bluePagesFriendlyErrorMessage(err.message || 'Network error.'))}</p>`;
    }
  }

  function uniqueValues(arr, fn) {
    const set = new Set();
    arr.forEach((item) => { const v = fn(item); if (Array.isArray(v)) v.forEach((x) => x && set.add(x)); else if (v) set.add(v); });
    return [...set].sort();
  }

  function orgEcosystemRoleCodes(org) {
    if (Array.isArray(org.ecosystemRoleCodes) && org.ecosystemRoleCodes.length) {
      return org.ecosystemRoleCodes.map(String);
    }
    const r = org.ecosystemRoles || {};
    const derived = [];
    if ((r.personalWallets || []).length) derived.push('personal_wallet_provider');
    if ((r.businessWallets || []).length) derived.push('business_wallet_provider');
    if ((r.credentialTypes || []).length) derived.push('vc_type_authority');
    if ((r.issuers || []).length) derived.push('issuer');
    if ((r.relyingParties || []).length) derived.push('relying_party');
    return derived;
  }

  function hasRole(org, role) {
    const codes = orgEcosystemRoleCodes(org);
    switch (role) {
      case 'issuer': return codes.includes('issuer');
      case 'credential': return codes.includes('vc_type_authority');
      case 'wallet':
        return codes.includes('personal_wallet_provider') || codes.includes('business_wallet_provider');
      case 'rp': return codes.includes('relying_party');
      default: return codes.includes(role);
    }
  }

  function getActiveFilterCount() {
    return filters.country.length + filters.role.length + filters.sector.length + filters.certification.length + filters.manifestoSupporter.length + filters.verifiedProfile.length + (filters.officialOnly ? 1 : 0) + filters.ids.length;
  }

  /** Per-option counts over the full loaded list (same idea as issuer-catalog facets). */
  function computeOrganizationFilterFacets() {
    const facets = {
      country: {},
      sector: {},
      certification: {},
      role: Object.fromEntries(ECOSYSTEM_ROLE_OPTIONS.map((opt) => [opt.value, 0])),
      officialOnly: 0,
    };
    for (const org of organizations) {
      if (orgCatalogTierIsPro(org)) facets.officialOnly += 1;
      const c = org.country;
      if (c) facets.country[c] = (facets.country[c] || 0) + 1;
      for (const s of orgSectorCodes(org)) {
        facets.sector[s] = (facets.sector[s] || 0) + 1;
      }
      for (const code of orgCertificationCodes(org)) {
        facets.certification[code] = (facets.certification[code] || 0) + 1;
      }
      for (const sub of orgCertificationSubValues(org)) {
        facets.certification[sub] = (facets.certification[sub] || 0) + 1;
      }
      for (const code of orgEcosystemRoleCodes(org)) {
        if (Object.prototype.hasOwnProperty.call(facets.role, code)) {
          facets.role[code] += 1;
        }
      }
    }
    return facets;
  }

  function getFilteredOrgs() {
    return organizations.filter((org) => {
      if (filters.ids.length > 0 && !filters.ids.includes(org.id)) return false;
      if (filters.country.length && !filters.country.includes(org.country)) return false;
      if (filters.role.length && !filters.role.some((role) => hasRole(org, role))) return false;
      if (filters.sector.length && !filters.sector.some((s) => orgSectorCodes(org).includes(s))) return false;
      if (filters.certification.length && !orgMatchesCertificationFilter(org)) return false;
      if (filters.manifestoSupporter.includes('listed') && org.fidesManifestoSupporter !== true) return false;
      if (filters.verifiedProfile.includes('listed') && !orgShowsBluePagesListBadge(org)) return false;
      if (tierUiEnabled() && filters.officialOnly && !orgCatalogTierIsPro(org)) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const inName = (org.name || '').toLowerCase().includes(q);
        const inLegal = (org.legalName || '').toLowerCase().includes(q);
        const inDesc = (org.description || '').toLowerCase().includes(q);
        const inIds = orgIdentifierValuesForSearch(org).includes(q);
        const inCerts = certificationsSearchHaystack(org).includes(q);
        const inOfferings = offeringsSearchHaystack(org).includes(q);
        const slug = typeof org.id === 'string' ? org.id.replace(/^org:/i, '').toLowerCase() : '';
        const inSlugOrWeb =
          (slug && slug.includes(q)) ||
          ((org.website || '').toLowerCase().includes(q));
        if (!inName && !inLegal && !inDesc && !inIds && !inCerts && !inOfferings && !inSlugOrWeb) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'country') return countryName(a.country || '').localeCompare(countryName(b.country || '')) || a.name.localeCompare(b.name);
      if (sortBy === 'updatedAt') return (b.updatedAt || '').localeCompare(a.updatedAt || '');
      return a.name.localeCompare(b.name);
    });
  }

  function renderOrgCard(org) {
    const logo = resolvedLogoUrl(org);
    const logoFallback = logoFallbackFromWebsite(org.website);
    const logoFallbackAttr = logoFallback ? ` data-fides-logo-fallback="${escapeHtml(logoFallback)}"` : '';

    const officialClass = orgOfficialCardClass(org);
    const logoMain = logo
      ? `<img src="${escapeHtml(logo)}" alt="" width="64" height="64" loading="lazy" decoding="async"${logoFallbackAttr}>`
      : icons.building;
    return `
      <div class="fides-org-card${officialClass}" data-id="${escapeHtml(org.id)}" tabindex="0" role="button" aria-label="${orgCardAriaLabel(org)}">
        <header class="fides-credential-header fides-org-card-header--text-only">
          <div class="fides-credential-header-text">
            <h3 class="fides-credential-name" title="${escapeHtml(org.name)}">${escapeHtml(org.name)}</h3>
            ${org.country ? `<p class="fides-credential-provider">${renderOrgCountryMeta(org)}</p>` : ''}
          </div>
        </header>
        <div class="fides-wallet-body">
          <div class="fides-org-card-logo-panel" aria-hidden="true">
            <div class="fides-org-card-logo-main">${logoMain}</div>
          </div>
        </div>
        <div class="fides-wallet-footer">
          <div class="fides-org-card-footer-start">
            ${renderOrgCardFooterBadges(org)}
            <div class="fides-wallet-links"></div>
          </div>
          <span class="fides-view-details">${icons.eye} View details</span>
        </div>
      </div>
    `;
  }

  function orgHasIdentifiers(org) {
    const idents = org && org.identifiers;
    if (!idents || typeof idents !== 'object') return false;
    return ORG_IDENTIFIER_FIELDS.some(([key]) => {
      const raw = idents[key];
      return typeof raw === 'string' && raw.trim();
    });
  }

  function renderOrganizationListingHeaderBadge(org) {
    if (window.FidesCatalogUI && typeof window.FidesCatalogUI.buildCatalogListingHeaderBadgeHtml === 'function') {
      return window.FidesCatalogUI.buildCatalogListingHeaderBadgeHtml(org, {
        tierUiEnabled: tierUiEnabled(),
        editAccess: config.editAccess,
      });
    }
    return '';
  }

  function renderOrganizationModalFooter(org, isCommunity) {
    if (window.FidesCatalogUI && typeof window.FidesCatalogUI.buildOrganizationContactFooterHtml === 'function') {
      return window.FidesCatalogUI.buildOrganizationContactFooterHtml(org.contact, {
        tierUiEnabled: tierUiEnabled(),
        isCommunity: isCommunity,
        item: org,
        editAccess: config.editAccess,
      });
    }
    return '';
  }

  function renderModalLastUpdatedHtml(item) {
    if (window.FidesCatalogUI && typeof window.FidesCatalogUI.buildModalLastUpdatedHtml === 'function') {
      return window.FidesCatalogUI.buildModalLastUpdatedHtml(item, ['updatedAt', 'updated', 'fetchedAt']);
    }
    return '';
  }

  function renderOrganizationHeroSection(org) {
    if (window.FidesCatalogUI && typeof window.FidesCatalogUI.buildOrganizationHeroSectionHtml === 'function') {
      return window.FidesCatalogUI.buildOrganizationHeroSectionHtml(org, {
        tierUiEnabled: tierUiEnabled(),
        editAccess: config.editAccess,
      });
    }
    return '';
  }

  /**
   * Accordion listing the use cases this organization is involved in.
   * Returns '' when there are none, so the accordion is simply omitted.
   */
  function renderUseCasesAccordion(useCases) {
    if (!Array.isArray(useCases) || useCases.length === 0) return '';
    const base = (config.useCaseCatalogUrl || '').replace(/\/$/, '');
    const rowsHtml = useCases.map((uc) => {
      const label = escapeHtml(uc.title || uc.id);
      const itemId = escapeHtml(uc.id || '');
      const likeSlot = uc.id
        ? `<span class="fides-modal-entity-like-slot" data-entity-like-type="usecase" data-entity-like-id="${itemId}">${renderModalEntityLikeInline('usecase', uc.id)}</span>`
        : '';
      if (base && uc.id) {
        const href = `${base}/?usecase=${encodeURIComponent(uc.id)}`;
        return `<tr><td><a href="${escapeHtml(href)}" class="fides-modal-link-inline" onclick="event.stopPropagation();">${label}</a>${likeSlot}</td></tr>`;
      }
      return `<tr><td>${label}${likeSlot}</td></tr>`;
    }).join('');
    return `
      <div class="fides-accordion" id="fides-accordion-use-cases">
        <div class="fides-accordion-header-bar">
          <button class="fides-accordion-header fides-accordion-toggle" type="button" aria-expanded="false">
            <span class="fides-accordion-title">${icons.useCases} Use cases <span class="fides-accordion-count">${useCases.length}</span></span>
          </button>
          <button type="button" class="fides-accordion-chevron-btn fides-accordion-toggle" aria-expanded="false" aria-label="Toggle use cases">
            <span class="fides-accordion-chevron">${icons.chevronDown}</span>
          </button>
        </div>
        <div class="fides-accordion-body">
          <div class="fides-attributes-table-wrap">
            <table class="fides-attributes-table fides-modal-entity-table" aria-label="Use cases">
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  function renderModal() {
    if (!selectedOrg) return '';
    const org = selectedOrg;
    const isCommunity = orgCatalogTierIsCommunity(org);
    const logo = resolvedLogoUrl(org);
    const logoFallback = logoFallbackFromWebsite(org.website);
    const logoFallbackAttr = logoFallback ? ` data-fides-logo-fallback="${escapeHtml(logoFallback)}"` : '';
    const r = org.ecosystemRoles || {};
    const theme = forcedModalTheme || root?.dataset?.theme || 'fides';

    const roleSections = [
      { key: 'issuers', items: r.issuers || [], icon: icons.server, label: 'Issuers', catalogUrl: config.issuerCatalogUrl, paramKey: 'issuer', ratingType: 'issuer' },
      { key: 'credentialTypes', items: r.credentialTypes || [], icon: icons.fileCheck, label: 'Credential Types', catalogUrl: config.credentialCatalogUrl, paramKey: 'credential', ratingType: 'credential' },
      { key: 'personalWallets', items: r.personalWallets || [], icon: icons.wallet, label: 'Personal Wallets', catalogUrl: config.walletCatalogUrl, paramKey: 'wallet', ratingType: 'wallet' },
      { key: 'businessWallets', items: r.businessWallets || [], icon: icons.wallet, label: 'Business Wallets', catalogUrl: config.walletCatalogUrl, paramKey: 'wallet', ratingType: 'wallet' },
      { key: 'relyingParties', items: r.relyingParties || [], icon: icons.shield, label: 'Relying Parties', catalogUrl: config.rpCatalogUrl, paramKey: 'rp', ratingType: 'rp' },
    ];

    const derivedUseCases = getDerivedUseCasesForOrg(org);
    const useCasesAccordionHtml = renderUseCasesAccordion(derivedUseCases);
    const certCount = countCatalogCertifications(org);
    const certCountBadge = certCount > 0 ? ` <span class="fides-accordion-count">${certCount}</span>` : '';
    const identifierRowsHtml = renderOrganizationIdentifierRows(org);
    const listingHeaderBadge = renderOrganizationListingHeaderBadge(org);

    return `
      <div class="fides-modal-overlay fides-modal-overlay--organization" id="fides-modal-overlay" data-theme="${escapeHtml(theme)}">
        <div class="fides-modal" role="dialog" aria-modal="true" aria-labelledby="fides-modal-title">
          <div class="fides-modal-header">
            <div class="fides-modal-header-content">
              ${logo
                ? `<img src="${escapeHtml(logo)}" alt="${escapeHtml(org.name)}" class="fides-modal-logo" loading="lazy" decoding="async"${logoFallbackAttr}>`
                : `<div class="fides-modal-logo-placeholder">${icons.building}</div>`
              }
              <div class="fides-modal-title-wrap">
                <div class="fides-modal-title-row">
                  <h2 class="fides-modal-title" id="fides-modal-title">${escapeHtml(org.name)}</h2>
                  ${listingHeaderBadge}
                </div>
                ${renderOrganizationModalHeaderMeta(org)}
              </div>
            </div>
            <div class="fides-modal-header-actions">
              ${renderModalEditAction(org)}
              <button type="button" class="fides-modal-copy-link" id="fides-modal-copy-link" aria-label="Copy link" title="Copy link">${icons.share}</button>
              <button class="fides-modal-close" id="fides-modal-close" aria-label="Close modal">${icons.xLarge}</button>
            </div>
          </div>

          <div class="fides-modal-body">
            ${renderOrganizationHeroSection(org)}
            <div class="fides-accordion is-open" id="fides-accordion-about">
              <div class="fides-accordion-header-bar">
                <button class="fides-accordion-header fides-accordion-toggle" type="button" aria-expanded="true">
                  <span class="fides-accordion-title">${icons.building} About</span>
                </button>
                <button type="button" class="fides-accordion-chevron-btn fides-accordion-toggle" aria-expanded="true" aria-label="Toggle About section">
                  <span class="fides-accordion-chevron">${icons.chevronDown}</span>
                </button>
              </div>
              <div class="fides-accordion-body">
                ${renderOrganizationModalAboutBody(org)}
              </div>
            </div>

            ${useCasesAccordionHtml}

            <!-- Role accordions -->
            ${roleSections.map((sec) => {
              if (sec.items.length === 0) return '';
              const base = (sec.catalogUrl || '').replace(/\/$/, '');
              return `
                <div class="fides-accordion" id="fides-accordion-${sec.key}">
                  <div class="fides-accordion-header-bar">
                    <button class="fides-accordion-header fides-accordion-toggle" type="button" aria-expanded="false">
                      <span class="fides-accordion-title">${sec.icon} ${escapeHtml(sec.label)} <span class="fides-accordion-count">${sec.items.length}</span></span>
                    </button>
                    <button type="button" class="fides-accordion-chevron-btn fides-accordion-toggle" aria-expanded="false" aria-label="Toggle ${sec.label}">
                      <span class="fides-accordion-chevron">${icons.chevronDown}</span>
                    </button>
                  </div>
                  <div class="fides-accordion-body">
                    <div class="fides-attributes-table-wrap">
                      <table class="fides-attributes-table fides-modal-entity-table" aria-label="${escapeHtml(sec.label)}">
                        <tbody>
                          ${sec.items.map((item) => {
                            const label = escapeHtml(item.displayName || item.id);
                            const itemId = escapeHtml(item.id || '');
                            const likeSlot = item.id
                              ? `<span class="fides-modal-entity-like-slot" data-entity-like-type="${escapeHtml(sec.ratingType)}" data-entity-like-id="${itemId}">${renderModalEntityLikeInline(sec.ratingType, item.id)}</span>`
                              : '';
                            if (base) {
                              const href = `${base}/?${sec.paramKey}=${encodeURIComponent(item.id)}`;
                              return `<tr><td><a href="${escapeHtml(href)}" class="fides-modal-link-inline" onclick="event.stopPropagation();">${label}</a>${likeSlot}</td></tr>`;
                            }
                            return `<tr><td>${label}${likeSlot}</td></tr>`;
                          }).join('')}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}

            <div class="fides-accordion" id="fides-accordion-certifications">
              <div class="fides-accordion-header-bar">
                <button class="fides-accordion-header fides-accordion-toggle" type="button" aria-expanded="false">
                  <span class="fides-accordion-title">${icons.fileCheck} Certifications${certCountBadge}</span>
                </button>
                <button type="button" class="fides-accordion-chevron-btn fides-accordion-toggle" aria-expanded="false" aria-label="Toggle certifications">
                  <span class="fides-accordion-chevron">${icons.chevronDown}</span>
                </button>
              </div>
              <div class="fides-accordion-body">
                ${renderCertificationsAccordionBody(org)}
              </div>
            </div>

            ${orgHasIdentifiers(org) ? `
            <div class="fides-accordion" id="fides-accordion-identifiers">
              <div class="fides-accordion-header-bar">
                <button class="fides-accordion-header fides-accordion-toggle" type="button" aria-expanded="false">
                  <span class="fides-accordion-title">${icons.building} Organization Identifiers</span>
                </button>
                <button type="button" class="fides-accordion-chevron-btn fides-accordion-toggle" aria-expanded="false" aria-label="Toggle organization identifiers">
                  <span class="fides-accordion-chevron">${icons.chevronDown}</span>
                </button>
              </div>
              <div class="fides-accordion-body">
                <div class="fides-details-kv">
                  ${identifierRowsHtml}
                </div>
              </div>
            </div>` : ''}
            ${renderModalLastUpdatedHtml(org)}
          </div>
          ${renderOrganizationOfficialProfileCta(org)}
          ${renderOrganizationModalFooter(org, isCommunity)}
        </div>
      </div>
    `;
  }

  /** Hide filter choices with zero matches, except keep active selections visible. */
  function filterOptionVisible(count, selectedList, value) {
    return count > 0 || (Array.isArray(selectedList) && selectedList.includes(value));
  }

  function renderCheckboxGroup(title, key, options, optionLabels, facets) {
    if (!options || options.length === 0) return '';
    const selected = filters[key] || [];
    const visibleOptions = options.filter((opt) => {
      const n = facets && facets[key] ? facets[key][opt] || 0 : 0;
      return filterOptionVisible(n, selected, opt);
    });
    if (!visibleOptions.length) return '';
    const expanded = filterGroupState[key] !== false;
    const hasActiveClass = selected.length > 0 ? 'has-active' : '';
    return `
      <div class="fides-filter-group collapsible ${expanded ? '' : 'collapsed'} ${hasActiveClass}" data-filter-group="${escapeHtml(key)}">
        <button class="fides-filter-label-toggle" type="button" aria-expanded="${expanded}">
          <span class="fides-filter-label">${escapeHtml(title)}</span>
          <span class="fides-filter-active-indicator"></span>
          ${icons.chevronDown}
        </button>
        <div class="fides-filter-options">
          ${visibleOptions.map((opt) => {
            const label = (optionLabels && optionLabels[opt]) ? optionLabels[opt] : (key === 'country' ? countryName(opt) : opt);
            const n = facets && facets[key] ? facets[key][opt] || 0 : 0;
            const flagPrefix = key === 'country' ? renderOrgCountryFilterFlag(opt) : '';
            return `
            <label class="fides-filter-checkbox">
              <input type="checkbox" data-filter-group="${escapeHtml(key)}" value="${escapeHtml(opt)}" ${selected.includes(opt) ? 'checked' : ''}>
              <span>${flagPrefix}${escapeHtml(label)}<span class="fides-filter-option-count">(${n})</span></span>
            </label>
          `; }).join('')}
        </div>
      </div>
    `;
  }

  /** Certification filter group with nested sub-options (qtsp trust services, diacc components). */
  function renderCertificationFilterGroup(facets) {
    const parentCodes = uniqueValues(organizations, (o) => orgCertificationCodes(o));
    if (!parentCodes.length) return '';
    const order = Object.keys(CERTIFICATION_LABELS);
    parentCodes.sort((a, b) => {
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
    const selected = filters.certification || [];
    const expanded = filterGroupState.certification !== false;
    const hasActiveClass = selected.length > 0 ? 'has-active' : '';
    const rows = parentCodes.flatMap((code) => {
      const label = CERTIFICATION_LABELS[code] || code;
      const n = (facets.certification && facets.certification[code]) || 0;
      if (!filterOptionVisible(n, selected, code)) return [];
      const parentRow = `
        <label class="fides-filter-checkbox">
          <input type="checkbox" data-filter-group="certification" value="${escapeHtml(code)}" ${selected.includes(code) ? 'checked' : ''}>
          <span>${escapeHtml(label)}<span class="fides-filter-option-count">(${n})</span></span>
        </label>`;
      const children = certificationChildOptions(code);
      if (!children.length) return [parentRow];
      const visibleChildren = children.filter((ch) => {
        const subVal = `${code}:${ch}`;
        const sn = (facets.certification && facets.certification[subVal]) || 0;
        return filterOptionVisible(sn, selected, subVal);
      });
      if (!visibleChildren.length) return [parentRow];
      const anyChildSelected = visibleChildren.some((ch) => selected.includes(`${code}:${ch}`));
      const open = certSubExpanded[code] === true || anyChildSelected;
      const childRows = visibleChildren.map((ch) => {
        const subVal = `${code}:${ch}`;
        const subLabel = certificationSubLabel(code, ch);
        const sn = (facets.certification && facets.certification[subVal]) || 0;
        return `
          <label class="fides-filter-checkbox fides-filter-checkbox--sub">
            <input type="checkbox" data-filter-group="certification" value="${escapeHtml(subVal)}" ${selected.includes(subVal) ? 'checked' : ''}>
            <span>${escapeHtml(subLabel)}<span class="fides-filter-option-count">(${sn})</span></span>
          </label>`;
      }).join('');
      return [
        parentRow,
        `<button type="button" class="fides-filter-subtoggle" data-cert-subtoggle="${escapeHtml(code)}" aria-expanded="${open}">
          ${icons.chevronDown}<span>${open ? 'Hide' : 'Show'} ${visibleChildren.length} options</span>
        </button>
        <div class="fides-filter-suboptions" ${open ? '' : 'hidden'}>${childRows}</div>`,
      ];
    }).join('');
    if (!rows) return '';
    return `
      <div class="fides-filter-group collapsible ${expanded ? '' : 'collapsed'} ${hasActiveClass}" data-filter-group="certification">
        <button class="fides-filter-label-toggle" type="button" aria-expanded="${expanded}">
          <span class="fides-filter-label">Certification</span>
          <span class="fides-filter-active-indicator"></span>
          ${icons.chevronDown}
        </button>
        <div class="fides-filter-options">
          ${rows}
        </div>
      </div>
    `;
  }

  function renderFiltersPanel() {
    if (!settings.showFilters) return '';
    const activeFilterCount = getActiveFilterCount();
    const facets = computeOrganizationFilterFacets();
    const countryOptions = uniqueValues(organizations, (o) => o.country)
      .sort((a, b) => countryName(a).localeCompare(countryName(b)));
    const roleOptions = ECOSYSTEM_ROLE_OPTIONS;
    const visibleRoleOptions = roleOptions.filter((opt) => {
      const n = facets.role[opt.value] || 0;
      return filterOptionVisible(n, filters.role, opt.value);
    });
    const roleFilterGroup = visibleRoleOptions.length ? `
          <div class="fides-filter-group collapsible ${filterGroupState.role !== false ? '' : 'collapsed'} ${filters.role.length > 0 ? 'has-active' : ''}" data-filter-group="role">
            <button class="fides-filter-label-toggle" type="button" aria-expanded="${filterGroupState.role !== false}">
              <span class="fides-filter-label">Ecosystem Role</span>
              <span class="fides-filter-active-indicator"></span>
              ${icons.chevronDown}
            </button>
            <div class="fides-filter-options">
              ${visibleRoleOptions.map((opt) => {
                const n = facets.role[opt.value] || 0;
                return `
                <label class="fides-filter-checkbox">
                  <input type="checkbox" data-filter-group="role" value="${escapeHtml(opt.value)}" ${filters.role.includes(opt.value) ? 'checked' : ''}>
                  <span>${escapeHtml(opt.label)}<span class="fides-filter-option-count">(${n})</span></span>
                </label>
              `;
              }).join('')}
            </div>
          </div>` : '';
    const showOfficialOnlyFilter = filterOptionVisible(facets.officialOnly || 0, filters.officialOnly ? ['true'] : [], 'true');
    return `
      <aside class="fides-sidebar">
        <div class="fides-sidebar-header">
          <div class="fides-sidebar-title">${icons.filter}<span>Filters</span><span class="fides-filter-count ${activeFilterCount > 0 ? '' : 'hidden'}">${activeFilterCount || 0}</span></div>
          <div class="fides-sidebar-actions">
            <button class="fides-clear-all ${activeFilterCount > 0 ? '' : 'hidden'}" id="fides-clear" type="button">${icons.x} Clear</button>
            <button class="fides-sidebar-close" id="fides-sidebar-close" aria-label="Close filters">${icons.xLarge}</button>
          </div>
        </div>
        <div class="fides-sidebar-content">
          ${tierUiEnabled() && showOfficialOnlyFilter ? `
          <div class="fides-quick-filters">
            <span class="fides-quick-filters-title">Quick filters</span>
            <label class="fides-filter-checkbox">
              <input type="checkbox" data-filter="officialOnly" data-value="true" ${filters.officialOnly ? 'checked' : ''}>
              <span>Official accounts only<span class="fides-filter-option-count">(${facets.officialOnly || 0})</span></span>
            </label>
          </div>
          ` : ''}
          ${roleFilterGroup}
          ${renderCheckboxGroup('Country', 'country', countryOptions, null, facets)}
          ${renderCheckboxGroup('Sector', 'sector', SECTOR_CODES_ALPHABETIC, SECTOR_LABELS, facets)}
          ${renderCertificationFilterGroup(facets)}
        </div>
      </aside>
    `;
  }

  function computeMetrics(items) {
    const list = Array.isArray(items) ? items : [];
    const issuerIds = new Set();
    const walletIds = new Set();
    const rpIds = new Set();

    for (const org of list) {
      const r = org.ecosystemRoles || {};
      (r.issuers || []).forEach((i) => issuerIds.add(i.id));
      (r.personalWallets || []).forEach((w) => walletIds.add(w.id));
      (r.businessWallets || []).forEach((w) => walletIds.add(w.id));
      (r.relyingParties || []).forEach((rp) => rpIds.add(rp.id));
    }

    return {
      total: list.length,
      issuers: issuerIds.size,
      walletProviders: walletIds.size,
      relyingParties: rpIds.size,
    };
  }

  function renderKpiCards(metrics) {
    return `
      <div class="fides-kpi-row" role="group" aria-label="Catalog summary">
        <div class="fides-kpi-card">
          <span class="fides-kpi-value">${metrics.total}</span>
          <span class="fides-kpi-label">Organizations</span>
        </div>
        <div class="fides-kpi-card">
          <span class="fides-kpi-value">${metrics.issuers}</span>
          <span class="fides-kpi-label">Issuers</span>
        </div>
        <div class="fides-kpi-card">
          <span class="fides-kpi-value">${metrics.walletProviders}</span>
          <span class="fides-kpi-label">Wallet Providers</span>
        </div>
        <div class="fides-kpi-card">
          <span class="fides-kpi-value">${metrics.relyingParties}</span>
          <span class="fides-kpi-label">Relying Parties</span>
        </div>
      </div>
    `;
  }

  function renderViewToggle() {
    return `
      <div class="fides-view-toggle" role="group" aria-label="View mode">
        <button class="fides-view-btn${viewMode === 'grid' ? ' active' : ''}" data-view="grid" aria-label="Grid view" aria-pressed="${viewMode === 'grid'}" title="Grid view">${icons.viewGrid}</button>
        <button class="fides-view-btn${viewMode === 'list' ? ' active' : ''}" data-view="list" aria-label="List view" aria-pressed="${viewMode === 'list'}" title="List view">${icons.viewList}</button>
      </div>
    `;
  }

  /**
   * List / table header — column count must match renderOrgRow() and CSS grid-template-columns.
   */
  function renderOrgListHeader() {
    return `
      <div class="fides-org-list-header" aria-hidden="true">
        <div></div>
        <div>Organization</div>
        <div class="fides-org-list-header-status"></div>
        <div class="fides-list-col-right" title="Issuers">${icons.server}</div>
        <div class="fides-list-col-right" title="Wallets">${icons.wallet}</div>
        <div class="fides-list-col-right" title="Relying parties">${icons.shield}</div>
      </div>
    `;
  }

  /**
   * Compact list row — same .fides-org-card shell as grid cards for shared click handlers.
   */
  function renderOrgRow(org) {
    const logo = resolvedLogoUrl(org);
    const logoFallback = logoFallbackFromWebsite(org.website);
    const logoFallbackAttr = logoFallback ? ` data-fides-logo-fallback="${escapeHtml(logoFallback)}"` : '';
    const r = org.ecosystemRoles || {};
    const issuerCount = (r.issuers || []).length;
    const walletCount = (r.personalWallets || []).length + (r.businessWallets || []).length;
    const rpCount = (r.relyingParties || []).length;
    const ccRaw = (org.country || '').trim();
    const cc = normalizeOrgCountryCode(ccRaw);
    const countryCell = cc
      ? renderOrgCountryListFlag(org)
      : '\u2014';

    const officialClass = orgOfficialCardClass(org);
    return `
      <div class="fides-org-card${officialClass}" data-id="${escapeHtml(org.id)}" tabindex="0" role="button" aria-label="${orgCardAriaLabel(org, true)}">
        <div class="fides-org-card-logo-wrap fides-org-card-logo-wrap--list">
          <div class="fides-row-icon" aria-hidden="true">
            ${logo
              ? `<img src="${escapeHtml(logo)}" alt="" style="width:22px;height:22px;object-fit:contain;border-radius:3px;" loading="lazy" decoding="async"${logoFallbackAttr}>`
              : icons.building
            }
          </div>
        </div>
        <div class="fides-row-name">
          <span class="fides-row-name-text" title="${escapeHtml(org.name)}">${escapeHtml(org.name)}</span>
          ${org.legalName && org.legalName !== org.name
            ? `<span class="fides-row-name-id" title="${escapeHtml(org.legalName)}">${escapeHtml(org.legalName)}</span>`
            : ''
          }
        </div>
        <div class="fides-row-list-status">
          ${renderOrgListBadges(org)}
          <div class="fides-row-environment">${countryCell}</div>
        </div>
        <div class="fides-row-count fides-list-col-right">${issuerCount}</div>
        <div class="fides-row-count fides-list-col-right">${walletCount}</div>
        <div class="fides-row-count fides-list-col-right">${rpCount}</div>
      </div>
    `;
  }

  function render() {
    const filtered = getFilteredOrgs();
    const metrics = computeMetrics(filtered);
    const mobileFiltersOpen = getMobileFilters()?.captureOpenState() || false;

    root.innerHTML = `
      <div class="fides-org-layout">
        <div class="fides-main-layout fides-main ${settings.showFilters ? '' : 'no-filters'}">
          ${renderFiltersPanel()}
          <section class="fides-main-content">
            <div class="fides-results-bar">
              ${settings.showSearch ? `
                <div class="fides-topbar-search">
                  <div class="fides-search-wrapper">
                    <span class="fides-search-icon">${icons.search}</span>
                    <input id="fides-search-input" class="fides-search-input" type="text" placeholder="Search organizations..." value="${escapeHtml(filters.search)}" autocomplete="off">
                    <button class="fides-search-clear ${filters.search ? '' : 'hidden'}" id="fides-search-clear" type="button" aria-label="Clear search">${icons.xSmall}</button>
                  </div>
                </div>
              ` : ''}
              <div class="fides-results-bar-actions">
                ${settings.showFilters ? `<button class="fides-mobile-filter-toggle" id="fides-mobile-filter-toggle">${icons.filter}<span>Filters</span><span class="fides-filter-count ${getActiveFilterCount() > 0 ? '' : 'hidden'}">${getActiveFilterCount() || 0}</span></button>` : ''}
                <label class="fides-sort-label" for="fides-sort-select">
                  <span class="fides-sort-text">Sort by:</span>
                  <select id="fides-sort-select" class="fides-sort-select">
                    <option value="name" ${sortBy === 'name' ? 'selected' : ''}>A–Z</option>
                    <option value="country" ${sortBy === 'country' ? 'selected' : ''}>Country</option>
                    <option value="updatedAt" ${sortBy === 'updatedAt' ? 'selected' : ''}>Last updated</option>
                  </select>
                </label>
              </div>
              ${renderViewToggle()}
            </div>
            ${renderKpiCards(metrics)}
            <div class="fides-results">
              <div class="fides-org-grid" data-view="${effectiveView()}" data-columns="${escapeHtml(settings.columns)}">
                ${effectiveView() === 'list' ? renderOrgListHeader() : ''}
                ${filtered.length > 0
                  ? filtered.map(effectiveView() === 'list' ? renderOrgRow : renderOrgCard).join('')
                  : '<p class="fides-empty">No organizations found.</p>'
                }
              </div>
            </div>
          </section>
        </div>
      </div>
    `;
    _lastOrgEffectiveView = effectiveView();
    bindEvents();
    getMobileFilters()?.applyAfterRender(mobileFiltersOpen);
  }

  function showToast(message, type = 'success') {
    const existing = document.querySelector('.fides-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = `fides-toast fides-toast-${type}`;
    toast.setAttribute('data-theme', root?.dataset?.theme || 'fides');
    toast.innerHTML = `<span class="fides-toast-icon">${type === 'success' ? icons.check : icons.x}</span><span class="fides-toast-message">${escapeHtml(message)}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.animation = 'fides-toast-out 0.3s ease forwards'; setTimeout(() => toast.remove(), 300); }, 3000);
  }

  function openModal(id) {
    selectedOrg = organizations.find((o) => o.id === id) || null;
    if (!selectedOrg) return;
    const existing = document.getElementById('fides-modal-overlay');
    if (existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', renderModal());
    document.body.style.overflow = 'hidden';
    bindModalEvents();
    const params = new URLSearchParams(window.location.search);
    params.set('org', id);
    history.replaceState(null, '', '?' + params.toString());
  }

  function closeModal() {
    selectedOrg = null;
    forcedModalTheme = null;
    const overlay = document.getElementById('fides-modal-overlay');
    if (overlay) {
      overlay.classList.add('closing');
      setTimeout(() => {
        overlay.remove();
        if (window.FidesCatalogUI && typeof window.FidesCatalogUI.syncCatalogBodyScrollLock === 'function') {
          window.FidesCatalogUI.syncCatalogBodyScrollLock({ root: root });
        } else if (!(root && root.querySelector('.fides-sidebar.mobile-open'))) {
          document.body.style.overflow = '';
        }
      }, 200);
    } else if (window.FidesCatalogUI && typeof window.FidesCatalogUI.syncCatalogBodyScrollLock === 'function') {
      window.FidesCatalogUI.syncCatalogBodyScrollLock({ root: root });
    } else if (!(root && root.querySelector('.fides-sidebar.mobile-open'))) {
      document.body.style.overflow = '';
    }
    const params = new URLSearchParams(window.location.search);
    params.delete('org');
    const qs = params.toString();
    history.replaceState(null, '', qs ? '?' + qs : window.location.pathname);
  }

  function bindModalEvents() {
    const closeBtn = document.getElementById('fides-modal-close');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    const overlay = document.getElementById('fides-modal-overlay');
    if (overlay) overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
    if (overlay) bindLogoFallbackHandlers(overlay);
    const copyBtn = document.getElementById('fides-modal-copy-link');
    if (copyBtn) copyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!selectedOrg) return;
      const url = new URL(window.location.href);
      url.searchParams.set('org', selectedOrg.id);
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(url.toString()).then(() => showToast('Link copied to clipboard'), () => showToast('Failed to copy link', 'error'));
      }
    });

    document.querySelectorAll('.fides-modal-overlay .fides-accordion-toggle[type="button"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const accordion = btn.closest('.fides-accordion');
        if (!accordion) return;
        const isOpen = accordion.classList.toggle('is-open');
        accordion.querySelectorAll('.fides-accordion-toggle[type="button"]').forEach((b) => b.setAttribute('aria-expanded', isOpen ? 'true' : 'false'));
      });
    });

    if (overlay) {
      overlay.querySelectorAll('.fides-org-cert-more-toggle').forEach((btn) => {
        btn.addEventListener('click', (event) => {
          event.stopPropagation();
          const next = btn.nextElementSibling;
          if (next && next.classList.contains('fides-org-cert-more-items')) {
            next.removeAttribute('hidden');
          }
          btn.remove();
        });
      });
    }

    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', escHandler); }
    });

    if (selectedOrg) {
      loadAndApplyModalRoleLikes(selectedOrg);
    }

    if (window.FidesCatalogUI && typeof window.FidesCatalogUI.initModalMediaCarousels === 'function') {
      window.FidesCatalogUI.initModalMediaCarousels();
    }
  }

  function bindEvents() {
    bindLogoFallbackHandlers(root);
    const searchInput = root.querySelector('#fides-search-input');
    const searchClear = root.querySelector('#fides-search-clear');
    const handleSearch = debounce((e) => {
      filters.search = e.target.value || '';
      if (searchClear) searchClear.classList.toggle('hidden', !filters.search);
      renderOrgGridOnly();
    }, 300);
    if (searchInput) searchInput.addEventListener('input', handleSearch);
    if (searchClear) searchClear.addEventListener('click', () => { filters.search = ''; if (searchInput) searchInput.value = ''; searchClear.classList.add('hidden'); renderOrgGridOnly(); });

    const sortSelect = root.querySelector('#fides-sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        const v = e.target.value;
        sortBy = SORT_OPTIONS.includes(v) ? v : DEFAULT_SORT;
        try {
          localStorage.setItem(SORT_STORAGE_KEY, sortBy);
        } catch {
          /* ignore */
        }
        render();
      });
    }

    const clearBtn = root.querySelector('#fides-clear');
    if (clearBtn) clearBtn.addEventListener('click', () => {
      filters = { search: '', country: [], role: [], sector: [], certification: [], manifestoSupporter: [], verifiedProfile: [], officialOnly: false, ids: [] };
      const url = new URL(window.location.href);
      url.searchParams.delete('sector');
      url.searchParams.delete('country');
      history.replaceState(null, '', url.toString());
      render();
    });

    root.querySelectorAll('.fides-quick-filters input[data-filter]').forEach((input) => {
      input.addEventListener('change', (e) => {
        const filterType = e.target.dataset.filter;
        if (filterType === 'officialOnly') {
          filters.officialOnly = e.target.checked;
          render();
        }
      });
    });

    root.querySelectorAll('[data-filter-group]').forEach((input) => {
      if (input.tagName !== 'INPUT') return;
      input.addEventListener('change', (e) => {
        const group = e.target.dataset.filterGroup;
        const value = e.target.value;
        if (!filters[group]) filters[group] = [];
        if (e.target.checked) { if (!filters[group].includes(value)) filters[group].push(value); }
        else { filters[group] = filters[group].filter((v) => v !== value); }
        render();
      });
    });

    getMobileFilters()?.bindCollapsibleToggles(filterGroupState);

    root.querySelectorAll('[data-cert-subtoggle]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const code = btn.dataset.certSubtoggle;
        certSubExpanded[code] = !(certSubExpanded[code] === true);
        render();
      });
    });

    // Mark parent certification checkboxes as indeterminate when only sub-options are selected.
    root.querySelectorAll('input[data-filter-group="certification"]').forEach((input) => {
      const val = input.value;
      if (val.includes(':') || input.checked) return;
      const prefix = `${val}:`;
      if (filters.certification.some((v) => v.startsWith(prefix))) input.indeterminate = true;
    });

    root.querySelectorAll('.fides-org-card').forEach((card) => {
      card.addEventListener('click', () => openModal(card.dataset.id));
      card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(card.dataset.id); } });
    });

    getMobileFilters()?.bindShell();

    root.querySelectorAll('.fides-view-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const newView = btn.getAttribute('data-view') || 'grid';
        if (newView === viewMode) return;
        viewMode = newView;
        localStorage.setItem('fides-org-view', viewMode);
        root.querySelectorAll('.fides-view-btn').forEach((b) => { const active = b.getAttribute('data-view') === viewMode; b.classList.toggle('active', active); b.setAttribute('aria-pressed', String(active)); });
        const grid = root.querySelector('.fides-org-grid');
        if (grid) grid.setAttribute('data-view', effectiveView());
        renderOrgGridOnly();
      });
    });
  }

  function renderOrgGridOnly() {
    const grid = root.querySelector('.fides-org-grid');
    if (!grid) return;
    const ev = effectiveView();
    grid.setAttribute('data-view', ev);
    const filtered = getFilteredOrgs();
    const metrics = computeMetrics(filtered);
    const kpiValues = root.querySelectorAll('.fides-kpi-card .fides-kpi-value');
    if (kpiValues.length >= 4) {
      kpiValues[0].textContent = String(metrics.total);
      kpiValues[1].textContent = String(metrics.issuers);
      kpiValues[2].textContent = String(metrics.walletProviders);
      kpiValues[3].textContent = String(metrics.relyingParties);
    }
    const header = ev === 'list' ? renderOrgListHeader() : '';
    const items = filtered.length > 0
      ? filtered.map(ev === 'list' ? renderOrgRow : renderOrgCard).join('')
      : '<p class="fides-empty">No organizations found.</p>';
    grid.innerHTML = header + items;
    _lastOrgEffectiveView = ev;
    root.querySelectorAll('.fides-org-card').forEach((card) => {
      card.addEventListener('click', () => openModal(card.dataset.id));
      card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(card.dataset.id); } });
    });
  }

  function checkDeepLink() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('org');
    if (id) openModal(id);
  }

  async function fetchJsonWithTimeout(url, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) return { ok: false, reason: `HTTP ${res.status}` };
      const data = await res.json();
      return { ok: true, data };
    } catch (err) {
      const timedOut = err && err.name === 'AbortError';
      return { ok: false, reason: timedOut ? `timeout ${timeoutMs}ms` : (err.message || 'network error') };
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Build org id → use cases[] from the use case catalog aggregated.json
   * (reverse join via links.organizations[].refId). Runtime join, mirroring
   * the RP catalog — organization aggregated.json carries no use-case field.
   */
  async function loadUseCaseIndex() {
    useCasesByOrgId = Object.create(null);
    const url = (config.useCaseAggregatedDataUrl || '').trim();
    if (!url) return;
    try {
      const response = await fetch(url);
      if (!response.ok) return;
      const data = await response.json();
      const useCases = Array.isArray(data.useCases) ? data.useCases : [];
      useCases.forEach(function (uc) {
        if (!uc || typeof uc.id !== 'string') return;
        const links = uc.links && typeof uc.links === 'object' ? uc.links : {};
        const orgs = Array.isArray(links.organizations) ? links.organizations : [];
        const entry = {
          id: uc.id,
          title: (uc.title || '').trim() || uc.id,
        };
        orgs.forEach(function (link) {
          if (!link || typeof link !== 'object') return;
          const orgId = link.refId ? String(link.refId).trim() : '';
          if (!orgId) return;
          if (!useCasesByOrgId[orgId]) useCasesByOrgId[orgId] = [];
          if (!useCasesByOrgId[orgId].some(function (e) { return e.id === entry.id; })) {
            useCasesByOrgId[orgId].push(entry);
          }
        });
      });
      Object.keys(useCasesByOrgId).forEach(function (orgId) {
        useCasesByOrgId[orgId].sort(function (a, b) {
          return String(a.title || a.id).localeCompare(String(b.title || b.id), undefined, { sensitivity: 'base' });
        });
      });
    } catch (e) {
      console.warn('Use case catalog index load failed:', e.message);
    }
  }

  function getDerivedUseCasesForOrg(org) {
    if (!org || !org.id) return [];
    return useCasesByOrgId[org.id] || [];
  }

  async function loadOrganizations() {
    const SOURCE_TIMEOUT_MS = 3500;
    const remote = { url: config.githubDataUrl, name: 'GitHub' };
    const localVersion = config.aggregatedDataVersion ? `?v=${encodeURIComponent(config.aggregatedDataVersion)}` : '';
    const local = { url: `${config.pluginUrl}data/aggregated.json${localVersion}`, name: 'Local' };
    const sources = isFidesLocalDevHost() ? [local, remote] : [remote, local];
    for (const source of sources) {
      if (!source.url) continue;
      const result = await fetchJsonWithTimeout(source.url, SOURCE_TIMEOUT_MS);
      if (result.ok) {
        organizations = result.data.organizations || [];
        console.log(`Loaded ${organizations.length} organizations from ${source.name}`);
        break;
      }
      console.warn(`Failed to load from ${source.name}: ${result.reason}`);
    }
    await loadUseCaseIndex();
    applySectorFromUrl();
    applyCountryFromUrl();
    try {
      render();
      checkDeepLink();
    } catch (err) {
      console.error('Failed to render organization catalog:', err);
      if (root) {
        root.innerHTML = '<p class="fides-empty">The organization catalog could not be rendered. Please refresh the page.</p>';
      }
    }
  }

  /** Pre-fill sector filter from ?sector= (canonical or legacy code). */
  function applySectorFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const code = normalizeSectorFilterCode(params.get('sector') || '');
    if (code) {
      filters.sector = [code];
    }
  }

  /** Pre-fill country filter from ?country= (ISO 3166-1 alpha-2). */
  function applyCountryFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const cc = normalizeCountryFilterCode(params.get('country') || '');
    if (cc) {
      filters.country = [cc];
    }
  }

  function init() {
    root = document.getElementById('fides-org-catalog-root');
    if (!root) return;
    syncCatalogConfig();
    settings = {
      showFilters: root.dataset.showFilters !== 'false',
      showSearch: root.dataset.showSearch !== 'false',
      columns: root.dataset.columns || '3',
      theme: root.dataset.theme || 'fides',
    };
    root.setAttribute('data-theme', settings.theme);
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      getMobileFilters()?.setOpen(false);
    });
    loadOrganizations();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function openModalFromData(org, options) {
    if (!org || typeof org !== 'object') return false;
    if (options && options.configOverrides && typeof options.configOverrides === 'object') {
      Object.assign(config, options.configOverrides);
    }
    selectedOrg = org;
    forcedModalTheme = (options && options.theme) ? String(options.theme) : null;
    const existing = document.getElementById('fides-modal-overlay');
    if (existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', renderModal());
    document.body.style.overflow = 'hidden';
    bindModalEvents();
    return true;
  }

  window.FidesOrganizationCatalogModal = {
    openFromData: openModalFromData,
    close: closeModal,
  };
})();
