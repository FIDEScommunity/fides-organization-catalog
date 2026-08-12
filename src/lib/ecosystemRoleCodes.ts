import type { AggregatedOrganization } from '../types/organization.js';

/** Closed ecosystem role taxonomy (schema + forms). */
export const ORGANIZATION_ECOSYSTEM_ROLE_CODES = [
  'personal_wallet_provider',
  'business_wallet_provider',
  'vc_type_authority',
  'issuer',
  'relying_party',
  'idv_provider',
  'kyb_provider',
  'system_integrator',
  'consultancy',
  'software_vendor',
  'business_registry',
  'industry_association',
  'standards_development_organization',
  'conformity_scheme_owner',
  'national_accreditation_body',
  'certification_body',
  'conformity_assessment_body',
  'eudi_wallet_intermediary',
  'eidas_trust_service_provider',
  'trust_infrastructure_provider',
  'interop_testbed_operator',
] as const;

export type OrganizationEcosystemRoleCode = (typeof ORGANIZATION_ECOSYSTEM_ROLE_CODES)[number];

export const ORGANIZATION_ECOSYSTEM_ROLE_LABELS: Record<OrganizationEcosystemRoleCode, string> = {
  personal_wallet_provider: 'Personal Wallet Provider',
  business_wallet_provider: 'Business Wallet Provider',
  vc_type_authority: 'VC Type Authority',
  issuer: 'Issuer',
  relying_party: 'Relying Party',
  idv_provider: 'IDV Provider',
  kyb_provider: 'KYB Provider',
  system_integrator: 'System Integrator',
  consultancy: 'Consultancy',
  software_vendor: 'Software Vendor',
  business_registry: 'Business Registry',
  industry_association: 'Industry Association',
  standards_development_organization: 'Standards Development Organization (SDO)',
  conformity_scheme_owner: 'Conformity Scheme Owner',
  national_accreditation_body: 'National Accreditation Body (NAB)',
  certification_body: 'Certification Body (CB)',
  conformity_assessment_body: 'Conformity Assessment Body (CAB)',
  eudi_wallet_intermediary: 'EUDI Wallet Intermediary',
  eidas_trust_service_provider: 'eIDAS Trust Service Provider',
  trust_infrastructure_provider: 'Trust Infrastructure Provider',
  interop_testbed_operator: 'Interop Testbed Operator',
};

const CODE_SET = new Set<string>(ORGANIZATION_ECOSYSTEM_ROLE_CODES);

export function isOrganizationEcosystemRoleCode(value: string): value is OrganizationEcosystemRoleCode {
  return CODE_SET.has(value);
}

export function normalizeEcosystemRoleCodes(raw: unknown): OrganizationEcosystemRoleCode[] {
  const values = Array.isArray(raw) ? raw : raw != null ? [raw] : [];
  const seen = new Set<OrganizationEcosystemRoleCode>();
  const out: OrganizationEcosystemRoleCode[] = [];
  for (const value of values) {
    const code = String(value).trim().replace(/-/g, '_');
    if (!isOrganizationEcosystemRoleCode(code) || seen.has(code)) continue;
    seen.add(code);
    out.push(code);
  }
  return ORGANIZATION_ECOSYSTEM_ROLE_CODES.filter((code) => seen.has(code));
}

export function deriveEcosystemRoleCodesFromLinks(
  links: AggregatedOrganization['ecosystemRoles'] | undefined,
): OrganizationEcosystemRoleCode[] {
  if (!links) return [];
  const out: OrganizationEcosystemRoleCode[] = [];
  if (links.personalWallets?.length) out.push('personal_wallet_provider');
  if (links.businessWallets?.length) out.push('business_wallet_provider');
  if (links.credentialTypes?.length) out.push('vc_type_authority');
  if (links.issuers?.length) out.push('issuer');
  if (links.relyingParties?.length) out.push('relying_party');
  return out;
}

export function mergeEcosystemRoleCodes(
  ...lists: (OrganizationEcosystemRoleCode[] | undefined)[]
): OrganizationEcosystemRoleCode[] {
  const seen = new Set<OrganizationEcosystemRoleCode>();
  const out: OrganizationEcosystemRoleCode[] = [];
  for (const code of ORGANIZATION_ECOSYSTEM_ROLE_CODES) {
    for (const list of lists) {
      if (list?.includes(code) && !seen.has(code)) {
        seen.add(code);
        out.push(code);
        break;
      }
    }
  }
  return out;
}

/** Legacy API / filter aliases → canonical codes. */
export function ecosystemRoleFilterMatches(
  codes: OrganizationEcosystemRoleCode[],
  filterRole: string,
): boolean {
  switch (filterRole) {
    case 'issuer':
      return codes.includes('issuer');
    case 'credential':
      return codes.includes('vc_type_authority');
    case 'wallet':
      return codes.includes('personal_wallet_provider') || codes.includes('business_wallet_provider');
    case 'rp':
      return codes.includes('relying_party');
    default:
      return isOrganizationEcosystemRoleCode(filterRole) && codes.includes(filterRole);
  }
}
