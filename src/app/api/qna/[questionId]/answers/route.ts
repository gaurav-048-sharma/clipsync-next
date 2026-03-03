import { NextRequest } from 'next/server';
import { createAnswer } from '@/lib/controllers/qnaController';

export async function POST(req: NextRequest, { params }: { params: Promise<{ questionId: string }> }) {
  const { questionId } = await params;
  return createAnswer(req, questionId);
}
