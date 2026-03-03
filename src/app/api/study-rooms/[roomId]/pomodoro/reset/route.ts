import { NextRequest } from 'next/server';
import { resetPomodoro } from '@/lib/controllers/studyRoomController';

// POST /api/study-rooms/[roomId]/pomodoro/reset
export async function POST(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  return resetPomodoro(req, roomId);
}
