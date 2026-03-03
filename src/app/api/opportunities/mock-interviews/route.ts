import { NextRequest } from 'next/server';
import { scheduleMockInterview, getMyMockInterviews } from '@/lib/controllers/opportunityController';

// GET /api/opportunities/mock-interviews
export async function GET(req: NextRequest) {
  return getMyMockInterviews(req);
}

// POST /api/opportunities/mock-interviews
export async function POST(req: NextRequest) {
  return scheduleMockInterview(req);
}
