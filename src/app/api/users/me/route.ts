import { NextRequest } from 'next/server';
import { getOwnProfile } from '@/lib/controllers/userController';

export async function GET(req: NextRequest) {
  return getOwnProfile(req);
}
