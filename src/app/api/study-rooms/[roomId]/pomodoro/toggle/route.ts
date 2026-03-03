import { NextRequest } from 'next/server';
import { togglePomodoroState } from '@/lib/controllers/studyRoomController';

// POST /api/study-rooms/[roomId]/pomodoro/toggle
export async function POST(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  return togglePomodoroState(req, roomId);
}
