import { NextRequest } from 'next/server';
import { getUserKarma } from '@/lib/controllers/opportunityController';

// GET /api/opportunities/karma
export async function GET(req: NextRequest) {
  return getUserKarma(req);
}
