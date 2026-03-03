import { NextRequest } from 'next/server';
import { leaveRoom } from '@/lib/controllers/studyRoomController';

// POST /api/study-rooms/[roomId]/leave
export async function POST(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  return leaveRoom(req, roomId);
}
