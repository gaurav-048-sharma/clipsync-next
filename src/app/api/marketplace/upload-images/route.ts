import { NextRequest } from 'next/server';
import { uploadImages } from '@/lib/controllers/marketplaceController';

export async function POST(req: NextRequest) { return uploadImages(req); }
