import { NextRequest } from 'next/server';
import { getGroupDetails, updateGroup } from '@/lib/controllers/groupChatController';

export async function GET(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  return getGroupDetails(req, groupId);
}
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  return updateGroup(req, groupId);
}
