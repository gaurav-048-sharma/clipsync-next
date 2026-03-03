import { NextRequest } from 'next/server';
import { getArchivedStories } from '@/lib/controllers/storyController';

export async function GET(req: NextRequest) {
  return getArchivedStories(req);
}
