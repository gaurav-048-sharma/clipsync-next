import { NextRequest } from 'next/server';
import { getMyQuestions } from '@/lib/controllers/qnaController';

export async function GET(req: NextRequest) { return getMyQuestions(req); }
