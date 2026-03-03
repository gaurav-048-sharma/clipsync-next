import { NextRequest } from 'next/server';
import { saveReel } from '@/lib/controllers/reelController';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return saveReel(req, id);
}
