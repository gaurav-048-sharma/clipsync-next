import { NextRequest } from 'next/server';
import { getFollowers } from '@/lib/controllers/userController';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return getFollowers(username);
}
