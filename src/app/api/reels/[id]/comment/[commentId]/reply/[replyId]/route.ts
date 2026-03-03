import { NextRequest } from 'next/server';
import { deleteReply, editReply } from '@/lib/controllers/reelController';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; commentId: string; replyId: string }> }) {
  const { id, commentId, replyId } = await params;
  return deleteReply(req, id, commentId, replyId);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; commentId: string; replyId: string }> }) {
  const { id, commentId, replyId } = await params;
  return editReply(req, id, commentId, replyId);
}
