import { NextRequest } from 'next/server';
import { resolveQuestion } from '@/lib/controllers/qnaController';

export async function POST(req: NextRequest, { params }: { params: Promise<{ questionId: string }> }) {
  const { questionId } = await params;
  return resolveQuestion(req, questionId);
}
