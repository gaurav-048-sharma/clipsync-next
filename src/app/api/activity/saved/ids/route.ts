import { NextRequest } from 'next/server';
import { getSavedPostIds } from '@/lib/controllers/activityController';

// GET /api/activity/saved/ids
export async function GET(req: NextRequest) {
  return getSavedPostIds(req);
}
