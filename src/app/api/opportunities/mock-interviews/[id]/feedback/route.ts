import { NextRequest } from 'next/server';
import { submitMockFeedback } from '@/lib/controllers/opportunityController';

// POST /api/opportunities/mock-interviews/[id]/feedback
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return submitMockFeedback(req, id);
}
