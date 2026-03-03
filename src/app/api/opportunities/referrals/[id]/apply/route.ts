import { NextRequest } from 'next/server';
import { applyForReferral } from '@/lib/controllers/opportunityController';

// POST /api/opportunities/referrals/[id]/apply
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return applyForReferral(req, id);
}
