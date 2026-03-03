import { NextRequest } from 'next/server';
import { getSalaryStats } from '@/lib/controllers/opportunityController';

// GET /api/opportunities/salary-stats
export async function GET(req: NextRequest) {
  return getSalaryStats(req);
}
