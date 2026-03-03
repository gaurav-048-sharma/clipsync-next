import { NextRequest } from 'next/server';
import { updateApplicationStatus } from '@/lib/controllers/opportunityController';

// PUT /api/opportunities/referrals/[id]/applications/[applicationId]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; applicationId: string }> }
) {
  const { id, applicationId } = await params;
  return updateApplicationStatus(req, id, applicationId);
}
