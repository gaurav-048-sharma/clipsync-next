import { NextRequest } from 'next/server';
import { getMyAnswers } from '@/lib/controllers/qnaController';

export async function GET(req: NextRequest) { return getMyAnswers(req); }
