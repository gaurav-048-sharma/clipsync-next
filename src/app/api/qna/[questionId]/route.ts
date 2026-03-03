import { NextRequest } from 'next/server';
import { getQuestion, updateQuestion, deleteQuestion } from '@/lib/controllers/qnaController';

export async function GET(req: NextRequest, { params }: { params: Promise<{ questionId: string }> }) {
  const { questionId } = await params;
  return getQuestion(req, questionId);
}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ questionId: string }> }) {
  const { questionId } = await params;
  return updateQuestion(req, questionId);
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ questionId: string }> }) {
  const { questionId } = await params;
  return deleteQuestion(req, questionId);
}
