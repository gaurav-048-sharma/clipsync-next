import { NextRequest } from 'next/server';
import { getChatMessages, sendChatMessage } from '@/lib/controllers/studyRoomController';

// GET /api/study-rooms/[roomId]/chat
export async function GET(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  return getChatMessages(req, roomId);
}

// POST /api/study-rooms/[roomId]/chat
export async function POST(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  return sendChatMessage(req, roomId);
}
