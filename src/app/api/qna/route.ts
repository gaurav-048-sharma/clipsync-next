import { NextRequest } from 'next/server';
import { getQuestions, createQuestion } from '@/lib/controllers/qnaController';

export async function GET(req: NextRequest) { return getQuestions(req); }
export async function POST(req: NextRequest) { return createQuestion(req); }
