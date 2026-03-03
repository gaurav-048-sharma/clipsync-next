import { NextRequest } from 'next/server';
import { addAnswerComment } from '@/lib/controllers/qnaController';

export async function POST(req: NextRequest, { params }: { params: Promise<{ answerId: string }> }) {
  const { answerId } = await params;
  return addAnswerComment(req, answerId);
}
