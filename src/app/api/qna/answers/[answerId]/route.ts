import { NextRequest } from 'next/server';
import { updateAnswer, deleteAnswer } from '@/lib/controllers/qnaController';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ answerId: string }> }) {
  const { answerId } = await params;
  return updateAnswer(req, answerId);
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ answerId: string }> }) {
  const { answerId } = await params;
  return deleteAnswer(req, answerId);
}
