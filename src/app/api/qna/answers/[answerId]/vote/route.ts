import { NextRequest } from 'next/server';
import { voteAnswer } from '@/lib/controllers/qnaController';

export async function POST(req: NextRequest, { params }: { params: Promise<{ answerId: string }> }) {
  const { answerId } = await params;
  return voteAnswer(req, answerId);
}
