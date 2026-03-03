import { NextRequest } from 'next/server';
import { incrementReelView } from '@/lib/controllers/reelController';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return incrementReelView(req, id);
}
