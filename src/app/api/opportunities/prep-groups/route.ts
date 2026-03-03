import { NextRequest } from 'next/server';
import { createPrepGroup, getPrepGroups } from '@/lib/controllers/opportunityController';

// GET /api/opportunities/prep-groups
export async function GET(req: NextRequest) {
  return getPrepGroups(req);
}

// POST /api/opportunities/prep-groups
export async function POST(req: NextRequest) {
  return createPrepGroup(req);
}
