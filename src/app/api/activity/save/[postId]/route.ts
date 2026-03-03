import { NextRequest } from 'next/server';
import { savePost, unsavePost } from '@/lib/controllers/activityController';

// POST /api/activity/save/[postId]
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;
  return savePost(req, postId);
}

// DELETE /api/activity/save/[postId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;
  return unsavePost(req, postId);
}
