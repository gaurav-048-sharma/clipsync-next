import { NextRequest } from 'next/server';
import { getSavedListings } from '@/lib/controllers/marketplaceController';

export async function GET(req: NextRequest) { return getSavedListings(req); }
