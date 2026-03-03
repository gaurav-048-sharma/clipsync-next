import { NextRequest } from 'next/server';
import { getAttendingEvents } from '@/lib/controllers/eventController';

export async function GET(req: NextRequest) { return getAttendingEvents(req); }
