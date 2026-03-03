import { NextRequest } from 'next/server';
import { getNotifications, markAllAsRead } from '@/lib/controllers/notificationController';

export async function GET(req: NextRequest) {
  return getNotifications(req);
}

export async function PUT(req: NextRequest) {
  return markAllAsRead(req);
}
