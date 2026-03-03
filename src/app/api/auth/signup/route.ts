import { NextRequest } from 'next/server';
import { signup } from '@/lib/controllers/authController';

export async function POST(req: NextRequest) {
  return signup(req);
}
