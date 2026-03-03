import { NextRequest } from 'next/server';
import { getUnreadCount } from '@/lib/controllers/notificationController';

export async function GET(req: NextRequest) {
  return getUnreadCount(req);
}
