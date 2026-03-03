import { NextRequest } from 'next/server';
import { getListings, createListing } from '@/lib/controllers/marketplaceController';

export async function GET(req: NextRequest) { return getListings(req); }
export async function POST(req: NextRequest) { return createListing(req); }
