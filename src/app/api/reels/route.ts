import { NextRequest } from 'next/server';
import { getAllPosts, createReel } from '@/lib/controllers/reelController';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return getAllPosts(req);
}

export async function POST(req: NextRequest) {
  return createReel(req);
}
