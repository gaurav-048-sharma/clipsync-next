import { NextRequest } from 'next/server';
import { getUser } from '@/lib/controllers/authController';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return getUser(username);
}
