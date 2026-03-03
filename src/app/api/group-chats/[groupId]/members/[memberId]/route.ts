import { NextRequest } from 'next/server';
import { removeMember } from '@/lib/controllers/groupChatController';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ groupId: string; memberId: string }> }) {
  const { groupId, memberId } = await params;
  return removeMember(req, groupId, memberId);
}
