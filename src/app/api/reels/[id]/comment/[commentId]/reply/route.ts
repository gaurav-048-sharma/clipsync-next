import { NextRequest } from 'next/server';
import { replyToComment } from '@/lib/controllers/reelController';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  const { id, commentId } = await params;
  return replyToComment(req, id, commentId);
}
