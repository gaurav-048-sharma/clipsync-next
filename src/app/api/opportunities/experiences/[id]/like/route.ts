import { NextRequest } from 'next/server';
import { likeExperience } from '@/lib/controllers/opportunityController';

// POST /api/opportunities/experiences/[id]/like
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return likeExperience(req, id);
}
