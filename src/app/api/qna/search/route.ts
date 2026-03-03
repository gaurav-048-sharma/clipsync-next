import { NextRequest } from 'next/server';
import { searchQuestions } from '@/lib/controllers/qnaController';

export async function GET(req: NextRequest) { return searchQuestions(req); }
