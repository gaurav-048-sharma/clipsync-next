import { NextRequest } from 'next/server';
import { getMyGroups, createGroup } from '@/lib/controllers/groupChatController';

export async function GET(req: NextRequest) { return getMyGroups(req); }
export async function POST(req: NextRequest) { return createGroup(req); }
