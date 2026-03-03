import { NextRequest } from 'next/server';
import { markAsSold } from '@/lib/controllers/marketplaceController';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return markAsSold(req, id);
}
