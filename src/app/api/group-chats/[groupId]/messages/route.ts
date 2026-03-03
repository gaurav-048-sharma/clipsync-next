import { NextRequest } from 'next/server';
import { getGroupMessages, sendGroupMessage } from '@/lib/controllers/groupChatController';

export async function GET(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  return getGroupMessages(req, groupId);
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  return sendGroupMessage(req, groupId);
}
