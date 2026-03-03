import { NextRequest } from 'next/server';
import { getMarketplaceCategories } from '@/lib/controllers/marketplaceController';

export async function GET() { return getMarketplaceCategories(); }
