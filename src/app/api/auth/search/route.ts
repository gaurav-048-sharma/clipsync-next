import { NextRequest } from 'next/server';
import { searchUsers } from '@/lib/controllers/authController';

export async function GET(req: NextRequest) {
  return searchUsers(req);
}
