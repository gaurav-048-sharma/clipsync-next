import { NextRequest } from 'next/server';
import { reactToStory } from '@/lib/controllers/storyController';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return reactToStory(req, id);
}
