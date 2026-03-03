import { NextRequest } from 'next/server';
import { reportListing } from '@/lib/controllers/marketplaceController';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return reportListing(req, id);
}
