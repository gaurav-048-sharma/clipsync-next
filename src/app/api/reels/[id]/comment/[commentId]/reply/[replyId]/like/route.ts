import { NextRequest } from 'next/server';
import { likeReply } from '@/lib/controllers/reelController';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; commentId: string; replyId: string }> }) {
  const { id, commentId, replyId } = await params;
  return likeReply(req, id, commentId, replyId);
}
