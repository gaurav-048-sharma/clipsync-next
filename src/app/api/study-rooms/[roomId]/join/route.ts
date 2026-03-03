import { NextRequest } from 'next/server';
import { joinRoom } from '@/lib/controllers/studyRoomController';

// POST /api/study-rooms/[roomId]/join
export async function POST(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  return joinRoom(req, roomId);
}
