// Source types (what contributors write in community-catalogs/**/organization-catalog.json)

/** Closed sector taxonomy (schema enum). */
export type OrganizationSectorCode =
  | 'public_sector'
  | 'finance'
  | 'trade'
  | 'supply_chain'
  | 'manufacturing'
  | 'energy'
  | 'agriculture'
  | 'food'
  | 'retail'
  | 'healthcare'
  | 'education'
  | 'construction'
  | 'mobility'
  | 'digital';

export const ORGANIZATION_SECTOR_CODES: readonly OrganizationSectorCode[] = [
  'public_sector',
  'finance',
  'trade',
  'supply_chain',
  'manufacturing',
  'energy',
  'agriculture',
  'food',
  'retail',
  'healthcare',
  'education',
  'construction',
  'mobility',
  'digital',
] as const;

export type CertificationCode = 'iso27001' | 'iso27701' | 'qtsp' | 'soc2';

export type CertificationEvidence =
  | { kind: 'url'; url: string; label?: string }
  | {
      kind: 'verifiable_credential';
      format: 'jwt_vc' | 'sd_jwt_vc' | 'ldp_vc' | 'other';
      credentialUri: string;
      notes?: string;
    };

export interface OrganizationCertification {
  code: CertificationCode;
  evidence?: CertificationEvidence;
}

/** Optional organization identifiers (at most one value per type). */
export interface OrganizationIdentifiers {
  business_registration_number?: string;
  vat_number?: string;
  lei?: string;
  eori?: string;
  euid?: string;
  duns?: string;
  gln?: string;
  did?: string;
}

export interface SourceOrganization {
  id: string;
  name: string;
  /** At least one sector (schema-enforced). */
  sectors: OrganizationSectorCode[];
  legalName?: string;
  description?: string;
  identifiers?: OrganizationIdentifiers;
  website?: string;
  logo?: string;
  country?: string;
  certifications?: OrganizationCertification[];
  tags?: string[];
  /** Listed on fides.community/manifesto FIDES Supporters section */
  fidesManifestoSupporter?: boolean;
  contact?: {
    email?: string;
    support?: string;
  };
}

export interface SourceOrganizationCatalog {
  $schema: string;
  organization: SourceOrganization;
  lastUpdated?: string;
}

// Ecosystem reference (link to an item in another catalog)

export interface EcosystemRef {
  id: string;
  displayName: string;
  catalogUrl?: string;
}

// Enriched / aggregated types (what ends up in data/aggregated.json)

export type OrganizationSource = 'community-catalog' | 'did-endpoint' | 'vc';

export interface AggregatedOrganization {
  id: string;
  name: string;
  sectors: OrganizationSectorCode[];
  legalName?: string;
  description?: string;
  identifiers?: OrganizationIdentifiers;
  website?: string;
  logoUri?: string;
  country?: string;
  certifications?: OrganizationCertification[];
  tags?: string[];
  fidesManifestoSupporter?: boolean;
  contact?: {
    email?: string;
    support?: string;
  };

  source: OrganizationSource;
  /** Community catalog JSON path relative to repo root (POSIX-style slashes). */
  catalogUrl: string;

  ecosystemRoles: {
    issuers: EcosystemRef[];
    credentialTypes: EcosystemRef[];
    personalWallets: EcosystemRef[];
    businessWallets: EcosystemRef[];
    relyingParties: EcosystemRef[];
  };

  /** Present when org has a DID; profileAvailable set by crawler against public Blue Pages API */
  bluePages?: {
    did: string;
    profileAvailable?: boolean;
    checkedAt?: string;
  };

  firstSeenAt: string;
  updatedAt: string;
  fetchedAt: string;
}

export interface AggregatedStats {
  totalOrganizations: number;
  byCountry: Record<string, number>;
  withIssuers: number;
  withCredentialTypes: number;
  withWallets: number;
  withRelyingParties: number;
  /** DIDs with a successful Blue Pages validations response (crawler) */
  withBluePagesProfile?: number;
}

export interface AggregatedOrganizationCatalog {
  schemaVersion: string;
  catalogType: 'organization';
  lastUpdated: string;
  organizations: AggregatedOrganization[];
  stats: AggregatedStats;
}

export interface OrganizationHistoryState {
  [orgId: string]: {
    firstSeenAt: string;
  };
}
