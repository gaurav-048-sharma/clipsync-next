import { NextRequest } from 'next/server';
import { uploadImages } from '@/lib/controllers/marketplaceController';

// Increase timeout for image uploads
export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) { return uploadImages(req); }
