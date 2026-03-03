import { NextRequest } from 'next/server';
import { getMyEvents } from '@/lib/controllers/eventController';

export async function GET(req: NextRequest) { return getMyEvents(req); }
