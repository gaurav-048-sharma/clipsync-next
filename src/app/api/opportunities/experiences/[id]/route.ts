import { NextRequest } from 'next/server';
import { getExperience } from '@/lib/controllers/opportunityController';

// GET /api/opportunities/experiences/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return getExperience(req, id);
}
