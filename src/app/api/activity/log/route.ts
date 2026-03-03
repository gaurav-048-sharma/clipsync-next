import { NextRequest } from 'next/server';
import { getActivityLog, clearActivityLog } from '@/lib/controllers/activityController';

// GET /api/activity/log
export async function GET(req: NextRequest) {
  return getActivityLog(req);
}

// DELETE /api/activity/log
export async function DELETE(req: NextRequest) {
  return clearActivityLog(req);
}
