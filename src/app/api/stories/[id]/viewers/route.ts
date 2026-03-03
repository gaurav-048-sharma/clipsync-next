import { NextRequest } from 'next/server';
import { getViewers } from '@/lib/controllers/storyController';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return getViewers(req, id);
}
