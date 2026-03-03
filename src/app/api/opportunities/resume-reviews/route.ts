import { NextRequest } from 'next/server';
import { submitResume } from '@/lib/controllers/opportunityController';

// POST /api/opportunities/resume-reviews
export async function POST(req: NextRequest) {
  return submitResume(req);
}
