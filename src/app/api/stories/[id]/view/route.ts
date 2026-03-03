import { NextRequest } from 'next/server';
import { viewStory } from '@/lib/controllers/storyController';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return viewStory(req, id);
}
