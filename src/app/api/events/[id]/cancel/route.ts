import { NextRequest } from 'next/server';
import { cancelEvent } from '@/lib/controllers/eventController';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return cancelEvent(req, id);
}
