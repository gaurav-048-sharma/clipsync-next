import { NextRequest } from 'next/server';
import { getMyResumeReviews } from '@/lib/controllers/opportunityController';

// GET /api/opportunities/resume-reviews/my
export async function GET(req: NextRequest) {
  return getMyResumeReviews(req);
}
