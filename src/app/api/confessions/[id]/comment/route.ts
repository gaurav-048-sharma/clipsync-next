import { NextRequest } from 'next/server';
import { addComment } from '@/lib/controllers/confessionController';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return addComment(req, id);
}
