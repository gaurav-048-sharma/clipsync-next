import { NextRequest } from 'next/server';
import { getConversation, markAsRead, deleteMessage } from '@/lib/controllers/messageController';

export async function GET(req: NextRequest, { params }: { params: Promise<{ recipientId: string }> }) {
  const { recipientId } = await params;
  return getConversation(req, recipientId);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ recipientId: string }> }) {
  const { recipientId } = await params;
  return markAsRead(req, recipientId);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ recipientId: string }> }) {
  const { recipientId } = await params;
  return deleteMessage(req, recipientId);
}
