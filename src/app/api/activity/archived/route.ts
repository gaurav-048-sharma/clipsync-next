import { NextRequest } from 'next/server';
import { getArchivedPosts } from '@/lib/controllers/activityController';

// GET /api/activity/archived
export async function GET(req: NextRequest) {
  return getArchivedPosts(req);
}
