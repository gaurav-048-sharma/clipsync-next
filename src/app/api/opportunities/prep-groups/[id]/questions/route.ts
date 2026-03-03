import { NextRequest } from 'next/server';
import { addPrepQuestion } from '@/lib/controllers/opportunityController';

// POST /api/opportunities/prep-groups/[id]/questions
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return addPrepQuestion(req, id);
}
