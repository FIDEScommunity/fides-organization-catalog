/**
 * GET /api/public/organization/:id
 * Returns one organization by catalog id (e.g. org:animo). Encode reserved characters in the path.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { loadOrganizationData } from '../../../lib/aggregatedData';

export default function handler(req: VercelRequest, res: VercelResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    res.status(405).json({
      message: 'Method not allowed',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const idRaw = req.query.id;
  const idParam = Array.isArray(idRaw) ? idRaw[0] : idRaw;
  if (typeof idParam !== 'string' || !idParam.length) {
    res.status(400).json({
      message: 'Missing organization id',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  let id: string;
  try {
    id = decodeURIComponent(idParam);
  } catch {
    res.status(400).json({
      message: 'Invalid organization id encoding',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const data = loadOrganizationData();
  const org = data.organizations.find((o) => o.id === id);

  if (!org) {
    res.status(404).json({
      message: 'Organization not found',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  res.status(200).json(org);
}
