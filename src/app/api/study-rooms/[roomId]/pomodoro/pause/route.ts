import { NextRequest } from 'next/server';
import { pausePomodoro } from '@/lib/controllers/studyRoomController';

// POST /api/study-rooms/[roomId]/pomodoro/pause
export async function POST(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  return pausePomodoro(req, roomId);
}
