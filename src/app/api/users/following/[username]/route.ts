import { NextRequest } from 'next/server';
import { getFollowing } from '@/lib/controllers/userController';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return getFollowing(username);
}
