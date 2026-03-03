import { NextRequest } from 'next/server';
import { getConversation } from '@/lib/controllers/messageController';

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return getConversation(req, userId);
}
