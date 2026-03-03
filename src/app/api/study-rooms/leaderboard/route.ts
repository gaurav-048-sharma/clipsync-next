import { NextRequest } from 'next/server';
import { getLeaderboard } from '@/lib/controllers/studyRoomController';

// GET /api/study-rooms/leaderboard
export async function GET(req: NextRequest) {
  return getLeaderboard(req);
}
