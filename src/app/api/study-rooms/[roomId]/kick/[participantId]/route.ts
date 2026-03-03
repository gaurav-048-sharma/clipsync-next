import { NextRequest } from 'next/server';
import { kickParticipant } from '@/lib/controllers/studyRoomController';

// POST /api/study-rooms/[roomId]/kick/[participantId]
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string; participantId: string }> }
) {
  const { roomId, participantId } = await params;
  return kickParticipant(req, roomId, participantId);
}
