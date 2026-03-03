import { NextRequest } from 'next/server';
import { markAsRead, deleteNotification } from '@/lib/controllers/notificationController';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return markAsRead(req, id);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return deleteNotification(req, id);
}
