import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  loadOrganizationData,
  type AggregatedOrganization,
} from '../../lib/aggregatedData';

type OrganizationSectorCode = AggregatedOrganization['sectors'][number];

function toNumber(val: unknown, fallback: number): number {
  const n = Number(val);
  return Number.isNaN(n) || n < 0 ? fallback : n;
}

function certificationSearchHaystack(o: AggregatedOrganization): string {
  const items = o.certifications;
  if (!items?.length) return '';
  const parts: string[] = [];
  for (const c of items) {
    parts.push(c.code);
    const ev = c.evidence;
    if (!ev) continue;
    if (ev.kind === 'url') {
      parts.push(ev.url, ev.label ?? '');
    } else if (ev.kind === 'verifiable_credential') {
      parts.push(ev.credentialUri, ev.format, ev.notes ?? '');
    }
  }
  return parts.join(' ').toLowerCase();
}

function orgSlugAndWebsiteHaystack(o: AggregatedOrganization): string {
  const slug = o.id?.replace(/^org:/i, '') ?? '';
  return `${slug} ${o.website ?? ''}`.toLowerCase();
}

export default function handler(req: VercelRequest, res: VercelResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).end();
    return;
  }

  const data = loadOrganizationData();
  let orgs = [...data.organizations];

  const country = typeof req.query.country === 'string' ? req.query.country : undefined;
  const role = typeof req.query.role === 'string' ? req.query.role : undefined;
  const search = typeof req.query.search === 'string' ? req.query.search.toLowerCase() : undefined;
  const certification = typeof req.query.certification === 'string' ? req.query.certification : undefined;
  const sector = typeof req.query.sector === 'string' ? req.query.sector : undefined;
  const fidesManifestoSupporter =
    typeof req.query.fidesManifestoSupporter === 'string'
      ? req.query.fidesManifestoSupporter.toLowerCase() === 'true'
      : undefined;

  if (country) {
    orgs = orgs.filter((o) => o.country === country);
  }

  if (role) {
    orgs = orgs.filter((o) => {
      const r = o.ecosystemRoles;
      switch (role) {
        case 'issuer': return r.issuers.length > 0;
        case 'credential': return r.credentialTypes.length > 0;
        case 'wallet': return r.personalWallets.length + r.businessWallets.length > 0;
        case 'rp': return r.relyingParties.length > 0;
        default: return true;
      }
    });
  }

  if (certification) {
    orgs = orgs.filter((o) => o.certifications?.some((c) => c.code === certification));
  }

  if (sector) {
    orgs = orgs.filter((o) => (o.sectors || []).includes(sector as OrganizationSectorCode));
  }

  if (fidesManifestoSupporter === true) {
    orgs = orgs.filter((o) => o.fidesManifestoSupporter === true);
  }

  if (search) {
    orgs = orgs.filter((o) => {
      const idHaystack = o.identifiers
        ? Object.values(o.identifiers)
            .filter((v): v is string => typeof v === 'string' && v.length > 0)
            .join(' ')
            .toLowerCase()
        : '';
      return (
        o.name.toLowerCase().includes(search) ||
        (o.legalName && o.legalName.toLowerCase().includes(search)) ||
        (o.description && o.description.toLowerCase().includes(search)) ||
        idHaystack.includes(search) ||
        certificationSearchHaystack(o).includes(search) ||
        orgSlugAndWebsiteHaystack(o).includes(search)
      );
    });
  }

  const sortField = typeof req.query.sort === 'string' ? req.query.sort : 'name';
  const sortDir = req.query.direction === 'desc' ? -1 : 1;

  orgs.sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case 'country':
        cmp = (a.country || '').localeCompare(b.country || '');
        break;
      case 'updatedAt':
        cmp = a.updatedAt.localeCompare(b.updatedAt);
        break;
      default:
        cmp = a.name.localeCompare(b.name);
    }
    return cmp * sortDir;
  });

  const page = toNumber(req.query.page, 0);
  const size = toNumber(req.query.size, 20);
  const start = page * size;
  const paged = orgs.slice(start, start + size);

  res.status(200).json({
    content: paged,
    totalElements: orgs.length,
    totalPages: Math.ceil(orgs.length / size),
    number: page,
    size,
  });
}
