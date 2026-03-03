import { NextRequest } from 'next/server';
import { getMyStats } from '@/lib/controllers/studyRoomController';

// GET /api/study-rooms/stats
export async function GET(req: NextRequest) {
  return getMyStats(req);
}
