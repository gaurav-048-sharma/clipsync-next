import { NextRequest } from 'next/server';
import { getPomodoroStatus } from '@/lib/controllers/studyRoomController';

// GET /api/study-rooms/[roomId]/pomodoro
export async function GET(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  return getPomodoroStatus(req, roomId);
}
