import { NextRequest } from 'next/server';
import { addResource } from '@/lib/controllers/opportunityController';

// POST /api/opportunities/prep-groups/[id]/resources
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return addResource(req, id);
}
