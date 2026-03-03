import { NextRequest } from 'next/server';
import { updatePomodoroSettings } from '@/lib/controllers/studyRoomController';

// PUT /api/study-rooms/[roomId]/pomodoro/settings
export async function PUT(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  return updatePomodoroSettings(req, roomId);
}
