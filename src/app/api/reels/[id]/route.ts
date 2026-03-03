import { NextRequest } from 'next/server';
import { getReel, updateReel, deleteReel, likeReel, commentOnReel, incrementReelView } from '@/lib/controllers/reelController';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return getReel(id);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return updateReel(req, id);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return deleteReel(req, id);
}
