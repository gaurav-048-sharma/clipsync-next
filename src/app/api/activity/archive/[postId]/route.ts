import { NextRequest } from 'next/server';
import { archivePost, unarchivePost } from '@/lib/controllers/activityController';

// POST /api/activity/archive/[postId]
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;
  return archivePost(req, postId);
}

// DELETE /api/activity/archive/[postId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;
  return unarchivePost(req, postId);
}
