import { NextRequest } from 'next/server';
import { googleLogin } from '@/lib/controllers/authController';

export async function POST(req: NextRequest) {
  return googleLogin(req);
}
