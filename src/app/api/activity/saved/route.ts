import { NextRequest } from 'next/server';
import { getSavedPosts } from '@/lib/controllers/activityController';

// GET /api/activity/saved
export async function GET(req: NextRequest) {
  return getSavedPosts(req);
}
