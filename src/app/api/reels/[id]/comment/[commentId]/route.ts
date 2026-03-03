import { NextRequest } from 'next/server';
import { likeComment, deleteComment, editComment } from '@/lib/controllers/reelController';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  const { id, commentId } = await params;
  return likeComment(req, id, commentId);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  const { id, commentId } = await params;
  return deleteComment(req, id, commentId);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  const { id, commentId } = await params;
  return editComment(req, id, commentId);
}
