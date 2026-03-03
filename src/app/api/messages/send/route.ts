import { NextRequest } from 'next/server';
import { sendMessage } from '@/lib/controllers/messageController';

export async function POST(req: NextRequest) {
  return sendMessage(req);
}
