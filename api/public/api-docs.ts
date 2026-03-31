import type { VercelRequest, VercelResponse } from '@vercel/node';

const spec = {
  openapi: '3.1.0',
  info: {
    title: 'FIDES Organization Catalog API',
    version: '1.0.0',
    description: 'Public API for querying organizations in the FIDES ecosystem and their roles across wallets, issuers, credentials, and relying parties.',
  },
  servers: [{ url: '/api/public' }],
  paths: {
    '/organization': {
      get: {
        summary: 'List organizations',
        operationId: 'listOrganizations',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search by name, legal name, description, identifiers, or certification fields' },
          { name: 'country', in: 'query', schema: { type: 'string' }, description: 'Filter by ISO 3166-1 alpha-2 country code' },
          { name: 'role', in: 'query', schema: { type: 'string', enum: ['issuer', 'credential', 'wallet', 'rp'] }, description: 'Filter by ecosystem role' },
          { name: 'certification', in: 'query', schema: { type: 'string', enum: ['iso27001', 'iso27701', 'qtsp', 'soc2'] }, description: 'Filter by certification code' },
          {
            name: 'sector',
            in: 'query',
            schema: {
              type: 'string',
              enum: [
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
              ],
            },
            description: 'Filter by sector code (organization must include this sector)',
          },
          { name: 'sort', in: 'query', schema: { type: 'string', enum: ['name', 'country', 'updatedAt'], default: 'name' } },
          { name: 'direction', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'asc' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 0 } },
          { name: 'size', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          '200': {
            description: 'Paginated list of organizations',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    content: { type: 'array', items: { $ref: '#/components/schemas/Organization' } },
                    totalElements: { type: 'integer' },
                    totalPages: { type: 'integer' },
                    number: { type: 'integer' },
                    size: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      OrganizationIdentifiers: {
        type: 'object',
        description: 'Optional identifiers; only present keys are returned.',
        properties: {
          business_registration_number: { type: 'string' },
          vat_number: { type: 'string' },
          lei: { type: 'string' },
          eori: { type: 'string' },
          euid: { type: 'string' },
          duns: { type: 'string' },
          gln: { type: 'string' },
          did: { type: 'string' },
        },
      },
      CertificationEvidence: {
        oneOf: [
          {
            type: 'object',
            required: ['kind', 'url'],
            properties: {
              kind: { const: 'url' },
              url: { type: 'string', format: 'uri' },
              label: { type: 'string' },
            },
          },
          {
            type: 'object',
            required: ['kind', 'format', 'credentialUri'],
            properties: {
              kind: { const: 'verifiable_credential' },
              format: { type: 'string', enum: ['jwt_vc', 'sd_jwt_vc', 'ldp_vc', 'other'] },
              credentialUri: { type: 'string', format: 'uri' },
              notes: { type: 'string' },
            },
          },
        ],
      },
      OrganizationCertification: {
        type: 'object',
        required: ['code'],
        properties: {
          code: { type: 'string', enum: ['iso27001', 'iso27701', 'qtsp', 'soc2'] },
          evidence: { $ref: '#/components/schemas/CertificationEvidence' },
        },
      },
      OrganizationSectorCode: {
        type: 'string',
        enum: [
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
        ],
      },
      Organization: {
        type: 'object',
        required: ['id', 'name', 'sectors'],
        properties: {
          id: { type: 'string', example: 'org:animo' },
          name: { type: 'string' },
          sectors: { type: 'array', minItems: 1, items: { $ref: '#/components/schemas/OrganizationSectorCode' } },
          legalName: { type: 'string' },
          description: { type: 'string' },
          identifiers: { $ref: '#/components/schemas/OrganizationIdentifiers' },
          website: { type: 'string', format: 'uri' },
          logoUri: { type: 'string', format: 'uri' },
          country: { type: 'string' },
          certifications: { type: 'array', items: { $ref: '#/components/schemas/OrganizationCertification' } },
          tags: { type: 'array', items: { type: 'string' } },
          ecosystemRoles: {
            type: 'object',
            properties: {
              issuers: { type: 'array', items: { $ref: '#/components/schemas/EcosystemRef' } },
              credentialTypes: { type: 'array', items: { $ref: '#/components/schemas/EcosystemRef' } },
              personalWallets: { type: 'array', items: { $ref: '#/components/schemas/EcosystemRef' } },
              businessWallets: { type: 'array', items: { $ref: '#/components/schemas/EcosystemRef' } },
              relyingParties: { type: 'array', items: { $ref: '#/components/schemas/EcosystemRef' } },
            },
          },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      EcosystemRef: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          displayName: { type: 'string' },
        },
      },
    },
  },
};

export default function handler(_req: VercelRequest, res: VercelResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600');
  res.status(200).json(spec);
}
