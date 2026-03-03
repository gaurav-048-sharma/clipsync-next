import { NextRequest } from 'next/server';
import { rsvpEvent } from '@/lib/controllers/eventController';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return rsvpEvent(req, id);
}
