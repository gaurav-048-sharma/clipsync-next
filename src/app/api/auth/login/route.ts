import { NextRequest } from 'next/server';
import { login } from '@/lib/controllers/authController';

export async function POST(req: NextRequest) {
  return login(req);
}
