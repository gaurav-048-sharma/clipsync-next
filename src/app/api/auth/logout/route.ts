import { NextRequest } from 'next/server';
import { logout } from '@/lib/controllers/authController';

export async function POST(req: NextRequest) {
  return logout(req);
}
