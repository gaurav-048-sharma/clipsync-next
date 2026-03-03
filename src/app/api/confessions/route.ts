import { NextRequest } from 'next/server';
import { getConfessions, createConfession } from '@/lib/controllers/confessionController';

export async function GET(req: NextRequest) { return getConfessions(req); }
export async function POST(req: NextRequest) { return createConfession(req); }
