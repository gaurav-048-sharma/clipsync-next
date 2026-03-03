import { NextRequest } from 'next/server';
import { getPrepGroup } from '@/lib/controllers/opportunityController';

// GET /api/opportunities/prep-groups/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return getPrepGroup(req, id);
}
