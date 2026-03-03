import { NextRequest } from 'next/server';
import { getUserReels } from '@/lib/controllers/reelController';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return getUserReels(username);
}
