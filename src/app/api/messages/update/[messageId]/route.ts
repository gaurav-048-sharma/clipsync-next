import { NextRequest } from 'next/server';
import { updateMessage } from '@/lib/controllers/messageController';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ messageId: string }> }) {
  const { messageId } = await params;
  return updateMessage(req, messageId);
}
