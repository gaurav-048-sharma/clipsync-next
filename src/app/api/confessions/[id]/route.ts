import { NextRequest } from 'next/server';
import { getConfession, deleteConfession } from '@/lib/controllers/confessionController';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return getConfession(req, id);
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return deleteConfession(req, id);
}
