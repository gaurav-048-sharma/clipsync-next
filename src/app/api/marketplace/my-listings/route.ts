import { NextRequest } from 'next/server';
import { getMyListings } from '@/lib/controllers/marketplaceController';

export async function GET(req: NextRequest) { return getMyListings(req); }
