import { NextRequest } from 'next/server';
import { getConversations } from '@/lib/controllers/messageController';

export async function GET(req: NextRequest) {
  return getConversations(req);
}
