import { NextRequest } from 'next/server';
import { startPomodoro } from '@/lib/controllers/studyRoomController';

// POST /api/study-rooms/[roomId]/pomodoro/start
export async function POST(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  return startPomodoro(req, roomId);
}
