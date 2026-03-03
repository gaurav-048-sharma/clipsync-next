import { NextRequest } from 'next/server';
import { getListing, updateListing, deleteListing } from '@/lib/controllers/marketplaceController';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return getListing(req, id);
}
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return updateListing(req, id);
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return deleteListing(req, id);
}
