import { NextRequest } from 'next/server';
import { getConversations, sendMessage } from '@/lib/controllers/messageController';

export async function GET(req: NextRequest) {
  return getConversations(req);
}

export async function POST(req: NextRequest) {
  return sendMessage(req);
}
