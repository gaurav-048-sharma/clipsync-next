import { NextRequest } from 'next/server';
import { getStoryById, deleteStory } from '@/lib/controllers/storyController';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return getStoryById(req, id);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return deleteStory(req, id);
}
