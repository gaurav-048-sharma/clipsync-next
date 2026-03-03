import { NextRequest } from 'next/server';
import { commentOnExperience } from '@/lib/controllers/opportunityController';

// POST /api/opportunities/experiences/[id]/comment
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return commentOnExperience(req, id);
}
