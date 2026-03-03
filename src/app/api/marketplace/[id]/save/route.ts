import { NextRequest } from 'next/server';
import { toggleSaveListing } from '@/lib/controllers/marketplaceController';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return toggleSaveListing(req, id);
}
