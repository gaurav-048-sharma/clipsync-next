import { NextRequest } from 'next/server';
import { deleteAnswerComment } from '@/lib/controllers/qnaController';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ answerId: string; commentId: string }> }) {
  const { answerId, commentId } = await params;
  return deleteAnswerComment(req, answerId, commentId);
}
