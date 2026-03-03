import { NextRequest } from 'next/server';
import { acceptAnswer } from '@/lib/controllers/qnaController';

export async function POST(req: NextRequest, { params }: { params: Promise<{ answerId: string }> }) {
  const { answerId } = await params;
  return acceptAnswer(req, answerId);
}
