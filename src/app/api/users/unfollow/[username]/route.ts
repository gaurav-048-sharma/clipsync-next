import { NextRequest } from 'next/server';
import { unfollowUser } from '@/lib/controllers/userController';

export async function POST(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return unfollowUser(req, username);
}
