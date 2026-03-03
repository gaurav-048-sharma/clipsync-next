import { NextRequest } from 'next/server';
import { getUserById } from '@/lib/controllers/authController';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return getUserById(req, id);
}
