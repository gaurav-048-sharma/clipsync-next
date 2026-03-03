import { NextRequest } from 'next/server';
import { createReferral, getReferrals } from '@/lib/controllers/opportunityController';

// GET /api/opportunities/referrals
export async function GET(req: NextRequest) {
  return getReferrals(req);
}

// POST /api/opportunities/referrals
export async function POST(req: NextRequest) {
  return createReferral(req);
}
