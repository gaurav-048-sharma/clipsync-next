import { NextRequest } from 'next/server';
import { joinPrepGroup } from '@/lib/controllers/opportunityController';

// POST /api/opportunities/prep-groups/[id]/join
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return joinPrepGroup(req, id);
}
