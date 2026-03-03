import { NextRequest } from 'next/server';
import { getPendingResumes } from '@/lib/controllers/opportunityController';

// GET /api/opportunities/resume-reviews/pending
export async function GET(req: NextRequest) {
  return getPendingResumes(req);
}
