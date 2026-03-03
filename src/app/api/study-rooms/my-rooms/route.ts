import { NextRequest } from 'next/server';
import { getMyRooms } from '@/lib/controllers/studyRoomController';

// GET /api/study-rooms/my-rooms
export async function GET(req: NextRequest) {
  return getMyRooms(req);
}
