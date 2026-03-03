import { NextRequest } from 'next/server';
import { getRoom, updateRoom, deleteRoom } from '@/lib/controllers/studyRoomController';

// GET /api/study-rooms/[roomId]
export async function GET(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  return getRoom(req, roomId);
}

// PUT /api/study-rooms/[roomId]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  return updateRoom(req, roomId);
}

// DELETE /api/study-rooms/[roomId]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  return deleteRoom(req, roomId);
}
