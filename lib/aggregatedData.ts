import fs from 'fs';
import path from 'path';

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

type CertificationCode = 'iso27001' | 'iso27701' | 'qtsp' | 'soc2' | 'diacc';

type OrganizationSectorCode =
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

interface CertificationTrustService {
  code: string;
  name?: string;
}

type CertificationEvidence =
  | { kind: 'url'; url: string; label?: string }
  | {
      kind: 'verifiable_credential';
      format: string;
      credentialUri: string;
      notes?: string;
    };

type DiaccComponentCode = 'digital_wallet' | 'verified_person' | 'privacy';

interface DiaccCertifiedComponent {
  component: DiaccComponentCode;
  loa?: string;
  evidence?: CertificationEvidence;
}

interface OrganizationCertification {
  code: CertificationCode;
  evidence?: CertificationEvidence;
  details?: {
    trustServices?: CertificationTrustService[];
    components?: DiaccCertifiedComponent[];
  };
}

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
  offerings?: string[];
  /** Community (free) or Pro; Pro-only fields present only when Pro. */
  catalogTier?: 'Community' | 'Pro' | string;
  fidesManifestoSupporter?: boolean;
  ecosystemRoles: {
    issuers: { id: string; displayName: string }[];
    credentialTypes: { id: string; displayName: string }[];
    personalWallets: { id: string; displayName: string }[];
    businessWallets: { id: string; displayName: string }[];
    relyingParties: { id: string; displayName: string }[];
  };
  /** Self-declared in community-catalog JSON (form submissions). */
  declaredEcosystemRoleCodes?: string[];
  /** Declared + cross-catalog derived roles (deduped). */
  ecosystemRoleCodes?: string[];
  updatedAt: string;
}

export interface AggregatedData {
  organizations: AggregatedOrganization[];
}

let dataCache: AggregatedData | null = null;
let lastLoad = 0;
const CACHE_TTL_MS = 60_000;

export function loadOrganizationData(): AggregatedData {
  const now = Date.now();
  if (dataCache && now - lastLoad < CACHE_TTL_MS) return dataCache;
  const raw = fs.readFileSync(path.join(process.cwd(), 'data', 'aggregated.json'), 'utf-8');
  dataCache = JSON.parse(raw) as AggregatedData;
  lastLoad = now;
  return dataCache;
}
