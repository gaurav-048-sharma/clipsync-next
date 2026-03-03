import { NextRequest } from 'next/server';
import { makeAdmin } from '@/lib/controllers/groupChatController';

export async function POST(req: NextRequest, { params }: { params: Promise<{ groupId: string; memberId: string }> }) {
  const { groupId, memberId } = await params;
  return makeAdmin(req, groupId, memberId);
}
