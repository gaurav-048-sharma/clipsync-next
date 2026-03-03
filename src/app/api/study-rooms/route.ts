import { NextRequest } from 'next/server';
import { getAllRooms, createRoom } from '@/lib/controllers/studyRoomController';

// GET /api/study-rooms
export async function GET(req: NextRequest) {
  return getAllRooms(req);
}

// POST /api/study-rooms
export async function POST(req: NextRequest) {
  return createRoom(req);
}
