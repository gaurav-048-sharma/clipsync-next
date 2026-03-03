import { NextRequest } from 'next/server';
import { submitReview } from '@/lib/controllers/opportunityController';

// POST /api/opportunities/resume-reviews/[id]/review
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return submitReview(req, id);
}
