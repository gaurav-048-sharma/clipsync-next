import { NextRequest } from 'next/server';
import { addMembers } from '@/lib/controllers/groupChatController';

export async function POST(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  return addMembers(req, groupId);
}
