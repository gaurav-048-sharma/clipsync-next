import { NextRequest } from 'next/server';
import { getInteractionsSummary } from '@/lib/controllers/activityController';

// GET /api/activity/interactions
export async function GET(req: NextRequest) {
  return getInteractionsSummary(req);
}
