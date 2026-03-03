import { NextRequest } from 'next/server';
import { isPostSaved } from '@/lib/controllers/activityController';

// GET /api/activity/saved/check/[postId]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;
  return isPostSaved(req, postId);
}
