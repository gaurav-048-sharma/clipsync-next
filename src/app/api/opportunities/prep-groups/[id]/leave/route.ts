import { NextRequest } from 'next/server';
import { leavePrepGroup } from '@/lib/controllers/opportunityController';

// POST /api/opportunities/prep-groups/[id]/leave
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return leavePrepGroup(req, id);
}
