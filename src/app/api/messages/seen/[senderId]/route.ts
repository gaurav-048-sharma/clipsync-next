import { NextRequest } from 'next/server';
import { markAsRead } from '@/lib/controllers/messageController';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ senderId: string }> }) {
  const { senderId } = await params;
  return markAsRead(req, senderId);
}
