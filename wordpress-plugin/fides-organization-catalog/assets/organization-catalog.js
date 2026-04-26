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
    check: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    qtsp: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="2.5" y="4" width="19" height="16" rx="2.5" fill="#1E3A8A"/><circle cx="12" cy="7.2" r="0.8" fill="#FACC15"/><circle cx="15.2" cy="8.2" r="0.8" fill="#FACC15"/><circle cx="16.8" cy="11" r="0.8" fill="#FACC15"/><circle cx="15.8" cy="14.2" r="0.8" fill="#FACC15"/><circle cx="13" cy="15.8" r="0.8" fill="#FACC15"/><circle cx="9.8" cy="14.8" r="0.8" fill="#FACC15"/><circle cx="8.2" cy="12" r="0.8" fill="#FACC15"/><circle cx="9.2" cy="8.8" r="0.8" fill="#FACC15"/><path d="M8.6 12.6l2.1 2.1 4.8-4.8" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    /** Lucide "users" — FIDES Manifesto / community supporter badge */
    community: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    eye: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
    globe: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>',
    tag: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></svg>',
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

  /** Schema key order for Organization details and search (labels in English). */
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

  const config = window.fidesOrganizationCatalog || {
    pluginUrl: '',
    githubDataUrl: 'https://raw.githubusercontent.com/FIDEScommunity/fides-organization-catalog/main/data/aggregated.json',
    issuerCatalogUrl: '',
    credentialCatalogUrl: '',
    walletCatalogUrl: '',
    rpCatalogUrl: '',
    bluePagesRestUrl: '',
    bluePagesProfileBaseUrl: '',
  };

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
  let sortBy = readStoredSort();
  let selectedOrg = null;
  let root;
  let viewMode = localStorage.getItem('fides-org-view') || 'grid';
  const LIST_BREAKPOINT = 1024;
  function effectiveView() {
    return window.innerWidth < LIST_BREAKPOINT ? 'grid' : viewMode;
  }
  let _lastOrgEffectiveView = effectiveView();
  window.addEventListener('resize', () => {
    if (!root) return;
    const cur = effectiveView();
    if (cur !== _lastOrgEffectiveView) {
      _lastOrgEffectiveView = cur;
      renderOrgGridOnly();
    }
  });

  const filterGroupState = { country: false, role: true, sector: false, certification: false };

  let filters = {
    search: '',
    country: [],
    role: [],
    sector: [],
    certification: [],
    manifestoSupporter: [],
    verifiedProfile: [],
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

  /** Grid card: outline badges bottom-left in footer (quiet, no fill). */
  function renderOrgCardFooterBadges(org) {
    const parts = [];
    if (org && org.fidesManifestoSupporter === true) {
      parts.push(`<span class="fides-org-footer-badge fides-org-footer-badge--manifesto" role="img" aria-label="FIDES Supporter" title="FIDES Supporter">${icons.community}</span>`);
    }
    if (orgShowsBluePagesListBadge(org)) {
      parts.push(`<span class="fides-org-footer-badge fides-org-footer-badge--bp" role="img" aria-label="Blue Pages verified profile available" title="Blue Pages verified profile available">${icons.shield}</span>`);
    }
    if (orgHasQtspBadge(org)) {
      parts.push(`<span class="fides-org-footer-badge fides-org-footer-badge--qtsp" role="img" aria-label="EU Qualified Trust Service Provider (eIDAS)" title="EU Qualified Trust Service Provider (eIDAS)">${icons.qtsp}</span>`);
    }
    if (parts.length === 0) return '';
    return `<div class="fides-org-card-footer-badges">${parts.join('')}</div>`;
  }

  /** List row: compact status icons next to flag (not on logo). Empty string when none — avoids extra flex gap. */
  function renderOrgListBadges(org) {
    const parts = [];
    if (org.fidesManifestoSupporter === true) {
      parts.push(`<span class="fides-row-badge-icon fides-row-badge-icon--manifesto" role="img" aria-label="FIDES Supporter" title="FIDES Supporter">${icons.community}</span>`);
    }
    if (orgShowsBluePagesListBadge(org)) {
      parts.push(`<span class="fides-row-badge-icon fides-row-badge-icon--bp" role="img" aria-label="Blue Pages verified profile available" title="Blue Pages verified profile available">${icons.shield}</span>`);
    }
    if (orgHasQtspBadge(org)) {
      parts.push(`<span class="fides-row-badge-icon fides-row-badge-icon--qtsp" role="img" aria-label="EU Qualified Trust Service Provider (eIDAS)" title="EU Qualified Trust Service Provider (eIDAS)">${icons.qtsp}</span>`);
    }
    if (parts.length === 0) return '';
    return `<div class="fides-row-badges">${parts.join('')}</div>`;
  }

  function orgCardAriaLabel(org) {
    const name = escapeHtml(org.name);
    const bits = [];
    if (orgShowsBluePagesListBadge(org)) bits.push('has Blue Pages verified profile');
    if (org && org.fidesManifestoSupporter === true) bits.push('FIDES Supporter');
    if (orgHasQtspBadge(org)) bits.push('qualified trust service provider');
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

  /** About accordion: description + sectors/tags taxonomy (credential-catalog modal style). */
  function renderOrganizationModalAboutBody(org) {
    const descRaw = org && org.description;
    const desc = typeof descRaw === 'string' && descRaw.trim() ? descRaw.trim() : '';
    const codes = orgSectorCodes(org);
    const sectorLabels = codes
      .map((c) => SECTOR_LABELS[c] || c)
      .sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
    const sectorInner = sectorLabels.map((l) => `<span class="fides-tag">${escapeHtml(l)}</span>`).join('');
    const rawTags = Array.isArray(org.tags) ? org.tags : [];
    const tagStrings = rawTags.filter((t) => typeof t === 'string' && t.trim()).map((t) => t.trim());
    const sortedTags = tagStrings.slice().sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
    const tagsInner = sortedTags.map((t) => `<span class="fides-tag">${escapeHtml(t)}</span>`).join('');
    const descBlock = desc
      ? `<p class="fides-modal-description fides-modal-org-overview-desc">${escapeHtml(desc)}</p>`
      : `<p class="fides-modal-description fides-modal-org-overview-desc fides-modal-org-overview-desc--empty">\u2014</p>`;
    return `
      ${descBlock}
      <div class="fides-modal-taxonomy fides-modal-taxonomy--org-overview">
        <div class="fides-modal-taxonomy-row">
          <span class="fides-modal-taxonomy-label">${icons.tag} Sectors</span>
          <div class="fides-modal-taxonomy-tags">${sectorInner || '<span class="fides-modal-taxonomy-empty">\u2014</span>'}</div>
        </div>
        ${tagsInner ? `<div class="fides-modal-taxonomy-row"><span class="fides-modal-taxonomy-label">${icons.tag} Tags</span><div class="fides-modal-taxonomy-tags">${tagsInner}</div></div>` : ''}
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
    }
    return bits.join(' ').toLowerCase();
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
          const linkLabel = (ev.label && String(ev.label).trim()) || 'Documentation';
          extra = ` <a href="${escapeHtml(ev.url)}" class="fides-modal-link-inline" target="_blank" rel="noopener" onclick="event.stopPropagation();">${escapeHtml(linkLabel)} ${icons.externalLink}</a>`;
        } else if (ev && typeof ev === 'object' && ev.kind === 'verifiable_credential' && ev.credentialUri) {
          const fmt = ev.format ? String(ev.format) : 'Credential';
          extra = ` <a href="${escapeHtml(ev.credentialUri)}" class="fides-modal-link-inline" target="_blank" rel="noopener" onclick="event.stopPropagation();">${escapeHtml(fmt)} VC ${icons.externalLink}</a>`;
          if (ev.notes && String(ev.notes).trim()) {
            extra += ` <span class="fides-org-cert-notes">${escapeHtml(String(ev.notes).trim())}</span>`;
          }
        }
        lines.push(`<div class="fides-org-cert-line"><span class="fides-tag fides-tag--cert">${escapeHtml(title)}</span>${extra}</div>`);
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

  function hasRole(org, role) {
    const r = org.ecosystemRoles || {};
    switch (role) {
      case 'issuer': return (r.issuers || []).length > 0;
      case 'credential': return (r.credentialTypes || []).length > 0;
      case 'wallet': return (r.personalWallets || []).length + (r.businessWallets || []).length > 0;
      case 'rp': return (r.relyingParties || []).length > 0;
      default: return true;
    }
  }

  function getActiveFilterCount() {
    return filters.country.length + filters.role.length + filters.sector.length + filters.certification.length + filters.manifestoSupporter.length + filters.verifiedProfile.length + filters.ids.length;
  }

  /** Per-option counts over the full loaded list (same idea as issuer-catalog facets). */
  function computeOrganizationFilterFacets() {
    const facets = {
      country: {},
      sector: {},
      certification: {},
      role: { issuer: 0, credential: 0, wallet: 0, rp: 0 },
    };
    for (const org of organizations) {
      const c = org.country;
      if (c) facets.country[c] = (facets.country[c] || 0) + 1;
      for (const s of orgSectorCodes(org)) {
        facets.sector[s] = (facets.sector[s] || 0) + 1;
      }
      for (const code of orgCertificationCodes(org)) {
        facets.certification[code] = (facets.certification[code] || 0) + 1;
      }
      if (hasRole(org, 'issuer')) facets.role.issuer += 1;
      if (hasRole(org, 'credential')) facets.role.credential += 1;
      if (hasRole(org, 'wallet')) facets.role.wallet += 1;
      if (hasRole(org, 'rp')) facets.role.rp += 1;
    }
    return facets;
  }

  function getFilteredOrgs() {
    return organizations.filter((org) => {
      if (filters.ids.length > 0 && !filters.ids.includes(org.id)) return false;
      if (filters.country.length && !filters.country.includes(org.country)) return false;
      if (filters.role.length && !filters.role.some((role) => hasRole(org, role))) return false;
      if (filters.sector.length && !filters.sector.some((s) => orgSectorCodes(org).includes(s))) return false;
      if (filters.certification.length && !filters.certification.some((c) => orgCertificationCodes(org).includes(c))) return false;
      if (filters.manifestoSupporter.includes('listed') && org.fidesManifestoSupporter !== true) return false;
      if (filters.verifiedProfile.includes('listed') && !orgShowsBluePagesListBadge(org)) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const inName = (org.name || '').toLowerCase().includes(q);
        const inLegal = (org.legalName || '').toLowerCase().includes(q);
        const inDesc = (org.description || '').toLowerCase().includes(q);
        const inIds = orgIdentifierValuesForSearch(org).includes(q);
        const inCerts = certificationsSearchHaystack(org).includes(q);
        const slug = typeof org.id === 'string' ? org.id.replace(/^org:/i, '').toLowerCase() : '';
        const inSlugOrWeb =
          (slug && slug.includes(q)) ||
          ((org.website || '').toLowerCase().includes(q));
        if (!inName && !inLegal && !inDesc && !inIds && !inCerts && !inSlugOrWeb) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'country') return countryName(a.country || '').localeCompare(countryName(b.country || '')) || a.name.localeCompare(b.name);
      if (sortBy === 'updatedAt') return (b.updatedAt || '').localeCompare(a.updatedAt || '');
      return a.name.localeCompare(b.name);
    });
  }

  function renderOrgCard(org) {
    const logo = org.logoUri;

    const manifestoClass = org.fidesManifestoSupporter === true ? ' fides-org-card--manifesto-supporter' : '';
    const logoMain = logo
      ? `<img src="${escapeHtml(logo)}" alt="" width="64" height="64">`
      : icons.building;
    return `
      <div class="fides-org-card${manifestoClass}" data-id="${escapeHtml(org.id)}" tabindex="0" role="button" aria-label="${orgCardAriaLabel(org)}">
        <header class="fides-credential-header fides-org-card-header--text-only">
          <div class="fides-credential-header-text">
            <h3 class="fides-credential-name" title="${escapeHtml(org.name)}">${escapeHtml(org.name)}</h3>
            ${org.country ? `<p class="fides-credential-provider">${escapeHtml(countryName(org.country))}</p>` : ''}
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

  function renderModal() {
    if (!selectedOrg) return '';
    const org = selectedOrg;
    const logo = org.logoUri;
    const r = org.ecosystemRoles || {};
    const theme = root?.dataset?.theme || 'fides';

    const roleSections = [
      { key: 'issuers', items: r.issuers || [], icon: icons.server, label: 'Issuers', catalogUrl: config.issuerCatalogUrl, paramKey: 'issuer' },
      { key: 'credentialTypes', items: r.credentialTypes || [], icon: icons.fileCheck, label: 'Credential Types', catalogUrl: config.credentialCatalogUrl, paramKey: 'credential' },
      { key: 'personalWallets', items: r.personalWallets || [], icon: icons.wallet, label: 'Personal Wallets', catalogUrl: config.walletCatalogUrl, paramKey: 'wallet' },
      { key: 'businessWallets', items: r.businessWallets || [], icon: icons.wallet, label: 'Business Wallets', catalogUrl: config.walletCatalogUrl, paramKey: 'wallet' },
      { key: 'relyingParties', items: r.relyingParties || [], icon: icons.shield, label: 'Relying Parties', catalogUrl: config.rpCatalogUrl, paramKey: 'rp' },
    ];

    const certCount = countCatalogCertifications(org);
    const certCountBadge = certCount > 0 ? ` <span class="fides-accordion-count">${certCount}</span>` : '';

    const supporterHeaderBadge = org.fidesManifestoSupporter === true
      ? `<span class="fides-modal-header-supporter-badge fides-org-footer-badge fides-org-footer-badge--manifesto" role="img" aria-label="FIDES Supporter" title="FIDES Supporter">${icons.community}</span>`
      : '';

    return `
      <div class="fides-modal-overlay" id="fides-modal-overlay" data-theme="${escapeHtml(theme)}">
        <div class="fides-modal" role="dialog" aria-modal="true" aria-labelledby="fides-modal-title">
          <div class="fides-modal-header">
            <div class="fides-modal-header-content">
              ${logo
                ? `<img src="${escapeHtml(logo)}" alt="${escapeHtml(org.name)}" class="fides-modal-logo">`
                : `<div class="fides-modal-logo-placeholder">${icons.building}</div>`
              }
              <div class="fides-modal-title-wrap">
                <div class="fides-modal-title-row">
                  <h2 class="fides-modal-title" id="fides-modal-title">${escapeHtml(org.name)}</h2>
                  ${supporterHeaderBadge}
                </div>
                ${org.country ? `<p class="fides-modal-provider">${icons.globe} <span>${escapeHtml(countryName(org.country))}</span></p>` : ''}
              </div>
            </div>
            <div class="fides-modal-header-actions">
              <button type="button" class="fides-modal-copy-link" id="fides-modal-copy-link" aria-label="Copy link" title="Copy link">${icons.share}</button>
              <button class="fides-modal-close" id="fides-modal-close" aria-label="Close modal">${icons.xLarge}</button>
            </div>
          </div>

          <div class="fides-modal-body">
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

            ${orgHasVerifiedProfileAccordion(org) ? `
            <div class="fides-accordion" id="fides-accordion-bluepages">
              <div class="fides-accordion-header-bar">
                <button class="fides-accordion-header fides-accordion-toggle" type="button" aria-expanded="false">
                  <span class="fides-accordion-title">${icons.shield} Verified profile (Blue Pages)</span>
                </button>
                <button type="button" class="fides-accordion-chevron-btn fides-accordion-toggle" aria-expanded="false" aria-label="Toggle Blue Pages verified profile">
                  <span class="fides-accordion-chevron">${icons.chevronDown}</span>
                </button>
              </div>
              <div class="fides-accordion-body">
                <div id="fides-org-bluepages-root" class="fides-org-bluepages" data-did="${escapeHtml(orgCatalogDid(org))}">
                  <p class="fides-org-bluepages-loading">Loading verified profile…</p>
                </div>
              </div>
            </div>` : ''}

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
                            if (base) {
                              const href = `${base}/?${sec.paramKey}=${encodeURIComponent(item.id)}`;
                              return `<tr><td><a href="${escapeHtml(href)}" class="fides-modal-link-inline" onclick="event.stopPropagation();">${label}</a></td></tr>`;
                            }
                            return `<tr><td>${label}</td></tr>`;
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

            <!-- Other details -->
            <div class="fides-accordion is-open" id="fides-accordion-details">
              <div class="fides-accordion-header-bar">
                <button class="fides-accordion-header fides-accordion-toggle" type="button" aria-expanded="true">
                  <span class="fides-accordion-title">${icons.building} Organization details</span>
                </button>
                <button type="button" class="fides-accordion-chevron-btn fides-accordion-toggle" aria-expanded="true" aria-label="Toggle details">
                  <span class="fides-accordion-chevron">${icons.chevronDown}</span>
                </button>
              </div>
              <div class="fides-accordion-body">
                <div class="fides-details-kv">
                  ${org.legalName ? `<div class="fides-kv-row"><span class="fides-kv-key">Legal name</span><span class="fides-kv-val">${escapeHtml(org.legalName)}</span></div>` : ''}
                  ${org.website ? `<div class="fides-kv-row"><span class="fides-kv-key">Website</span><span class="fides-kv-val fides-kv-val--url"><a href="${escapeHtml(org.website)}" target="_blank" rel="noopener" class="fides-modal-link-inline fides-url-ellipsis" onclick="event.stopPropagation();">${escapeHtml(org.website)} ${icons.externalLink}</a></span></div>` : ''}
                  ${renderOrganizationIdentifierRows(org)}
                  ${org.contact?.email && String(org.contact.email).trim() ? `<div class="fides-kv-row"><span class="fides-kv-key">Email</span><span class="fides-kv-val"><a href="mailto:${escapeHtml(String(org.contact.email).trim())}" class="fides-modal-link-inline">${escapeHtml(String(org.contact.email).trim())}</a></span></div>` : ''}
                  ${org.contact?.support && String(org.contact.support).trim() ? `<div class="fides-kv-row"><span class="fides-kv-key">Support</span><span class="fides-kv-val fides-kv-val--url"><a href="${escapeHtml(String(org.contact.support).trim())}" target="_blank" rel="noopener" class="fides-modal-link-inline fides-url-ellipsis" onclick="event.stopPropagation();">${escapeHtml(String(org.contact.support).trim())} ${icons.externalLink}</a></span></div>` : ''}
                  <div class="fides-kv-row"><span class="fides-kv-key">Last updated</span><span class="fides-kv-val">${escapeHtml(org.updatedAt ? formatDate(org.updatedAt) : '—')}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderCheckboxGroup(title, key, options, optionLabels, facets) {
    if (!options || options.length === 0) return '';
    const selected = filters[key] || [];
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
          ${options.map((opt) => {
            const label = (optionLabels && optionLabels[opt]) ? optionLabels[opt] : (key === 'country' ? countryName(opt) : opt);
            const n = facets && facets[key] ? facets[key][opt] || 0 : 0;
            return `
            <label class="fides-filter-checkbox">
              <input type="checkbox" data-filter-group="${escapeHtml(key)}" value="${escapeHtml(opt)}" ${selected.includes(opt) ? 'checked' : ''}>
              <span>${escapeHtml(label)}<span class="fides-filter-option-count">(${n})</span></span>
            </label>
          `; }).join('')}
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
    const roleOptions = [
      { value: 'issuer', label: 'Issuer' },
      { value: 'credential', label: 'Credential Authority' },
      { value: 'wallet', label: 'Wallet Provider' },
      { value: 'rp', label: 'Relying Party' },
    ];
    const certOptions = uniqueValues(organizations, (o) => orgCertificationCodes(o));

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
          <div class="fides-filter-group collapsible ${filterGroupState.role !== false ? '' : 'collapsed'} ${filters.role.length > 0 ? 'has-active' : ''}" data-filter-group="role">
            <button class="fides-filter-label-toggle" type="button" aria-expanded="${filterGroupState.role !== false}">
              <span class="fides-filter-label">Ecosystem Role</span>
              <span class="fides-filter-active-indicator"></span>
              ${icons.chevronDown}
            </button>
            <div class="fides-filter-options">
              ${roleOptions.map((opt) => {
                const n = facets.role[opt.value] || 0;
                return `
                <label class="fides-filter-checkbox">
                  <input type="checkbox" data-filter-group="role" value="${escapeHtml(opt.value)}" ${filters.role.includes(opt.value) ? 'checked' : ''}>
                  <span>${escapeHtml(opt.label)}<span class="fides-filter-option-count">(${n})</span></span>
                </label>
              `;
              }).join('')}
            </div>
          </div>
          ${renderCheckboxGroup('Country', 'country', countryOptions, null, facets)}
          ${renderCheckboxGroup('Sector', 'sector', SECTOR_CODES_ALPHABETIC, SECTOR_LABELS, facets)}
          ${renderCheckboxGroup('Certification', 'certification', certOptions, CERTIFICATION_LABELS, facets)}
        </div>
      </aside>
    `;
  }

  function computeMetrics() {
    let totalIssuers = 0;
    let totalWallets = 0;
    let totalRps = 0;
    const issuerIds = new Set();
    const walletIds = new Set();
    const rpIds = new Set();

    for (const org of organizations) {
      const r = org.ecosystemRoles || {};
      (r.issuers || []).forEach((i) => issuerIds.add(i.id));
      (r.personalWallets || []).forEach((w) => walletIds.add(w.id));
      (r.businessWallets || []).forEach((w) => walletIds.add(w.id));
      (r.relyingParties || []).forEach((rp) => rpIds.add(rp.id));
    }

    return {
      total: organizations.length,
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
    const logo = org.logoUri;
    const r = org.ecosystemRoles || {};
    const issuerCount = (r.issuers || []).length;
    const walletCount = (r.personalWallets || []).length + (r.businessWallets || []).length;
    const rpCount = (r.relyingParties || []).length;
    const ccRaw = (org.country || '').trim();
    const cc = ccRaw.toUpperCase();
    const countryFull = cc ? countryName(org.country) : '';
    const flag = flagEmojiFromAlpha2(cc);
    const countryCell = cc
      ? `<span class="fides-row-flag" title="${escapeHtml(countryFull)}" role="img" aria-label="${escapeHtml(countryFull)}">${flag}</span>`
      : '\u2014';

    const manifestoClass = org.fidesManifestoSupporter === true ? ' fides-org-card--manifesto-supporter' : '';
    return `
      <div class="fides-org-card${manifestoClass}" data-id="${escapeHtml(org.id)}" tabindex="0" role="button" aria-label="${orgCardAriaLabel(org)}">
        <div class="fides-org-card-logo-wrap fides-org-card-logo-wrap--list">
          <div class="fides-row-icon" aria-hidden="true">
            ${logo
              ? `<img src="${escapeHtml(logo)}" alt="" style="width:22px;height:22px;object-fit:contain;border-radius:3px;">`
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
    const metrics = computeMetrics();

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
              <label class="fides-sort-label" for="fides-sort-select">
                <span class="fides-sort-text">Sort by:</span>
                <select id="fides-sort-select" class="fides-sort-select">
                  <option value="name" ${sortBy === 'name' ? 'selected' : ''}>A–Z</option>
                  <option value="country" ${sortBy === 'country' ? 'selected' : ''}>Country</option>
                  <option value="updatedAt" ${sortBy === 'updatedAt' ? 'selected' : ''}>Last updated</option>
                </select>
              </label>
              ${settings.showFilters ? `<button class="fides-mobile-filter-toggle" id="fides-mobile-filter-toggle">${icons.filter}<span>Filters</span><span class="fides-filter-count ${getActiveFilterCount() > 0 ? '' : 'hidden'}">${getActiveFilterCount() || 0}</span></button>` : ''}
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
    const overlay = document.getElementById('fides-modal-overlay');
    if (overlay) { overlay.classList.add('closing'); setTimeout(() => overlay.remove(), 200); }
    document.body.style.overflow = '';
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

    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', escHandler); }
    });

    if (selectedOrg && orgHasVerifiedProfileAccordion(selectedOrg)) {
      loadBluePagesSection(orgCatalogDid(selectedOrg));
    }
  }

  function bindEvents() {
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
      filters = { search: '', country: [], role: [], sector: [], certification: [], manifestoSupporter: [], verifiedProfile: [], ids: [] };
      const url = new URL(window.location.href);
      url.searchParams.delete('sector');
      url.searchParams.delete('country');
      history.replaceState(null, '', url.toString());
      render();
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

    root.querySelectorAll('.fides-filter-label-toggle').forEach((toggle) => {
      toggle.addEventListener('click', () => {
        const group = toggle.closest('.fides-filter-group')?.dataset.filterGroup;
        if (group && Object.prototype.hasOwnProperty.call(filterGroupState, group)) {
          filterGroupState[group] = !filterGroupState[group];
          render();
        }
      });
    });

    root.querySelectorAll('.fides-org-card').forEach((card) => {
      card.addEventListener('click', () => openModal(card.dataset.id));
      card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(card.dataset.id); } });
    });

    const mobileToggle = root.querySelector('#fides-mobile-filter-toggle');
    const sidebar = root.querySelector('.fides-sidebar');
    if (mobileToggle && sidebar) mobileToggle.addEventListener('click', () => { sidebar.classList.add('mobile-open'); document.body.style.overflow = 'hidden'; });
    const sidebarClose = root.querySelector('#fides-sidebar-close');
    if (sidebarClose && sidebar) sidebarClose.addEventListener('click', () => { sidebar.classList.remove('mobile-open'); document.body.style.overflow = ''; });

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

  async function loadOrganizations() {
    const remote = { url: config.githubDataUrl, name: 'GitHub' };
    const local = { url: `${config.pluginUrl}data/aggregated.json`, name: 'Local' };
    const sources = isFidesLocalDevHost() ? [local, remote] : [remote, local];
    for (const source of sources) {
      if (!source.url) continue;
      try {
        const res = await fetch(source.url);
        if (res.ok) {
          const data = await res.json();
          organizations = data.organizations || [];
          console.log(`Loaded ${organizations.length} organizations from ${source.name}`);
          break;
        }
      } catch (err) {
        console.warn(`Failed to load from ${source.name}:`, err.message);
      }
    }
    applySectorFromUrl();
    applyCountryFromUrl();
    render();
    checkDeepLink();
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
    settings = {
      showFilters: root.dataset.showFilters !== 'false',
      showSearch: root.dataset.showSearch !== 'false',
      columns: root.dataset.columns || '3',
      theme: root.dataset.theme || 'fides',
    };
    root.setAttribute('data-theme', settings.theme);
    loadOrganizations();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
