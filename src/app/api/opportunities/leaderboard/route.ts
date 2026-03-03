import { NextRequest } from 'next/server';
import { getOpportunityLeaderboard } from '@/lib/controllers/opportunityController';

// GET /api/opportunities/leaderboard
export async function GET(req: NextRequest) {
  return getOpportunityLeaderboard(req);
}
