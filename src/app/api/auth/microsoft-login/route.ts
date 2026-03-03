import { NextRequest } from 'next/server';
import { microsoftLogin } from '@/lib/controllers/authController';

export async function POST(req: NextRequest) {
  return microsoftLogin(req);
}
