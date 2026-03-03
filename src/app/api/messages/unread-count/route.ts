import { NextRequest } from 'next/server';
import { getUnreadCount } from '@/lib/controllers/messageController';

export async function GET(req: NextRequest) {
  return getUnreadCount(req);
}
