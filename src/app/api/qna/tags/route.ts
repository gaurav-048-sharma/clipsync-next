import { NextRequest } from 'next/server';
import { getTags } from '@/lib/controllers/qnaController';

export async function GET(req: NextRequest) { return getTags(req); }
