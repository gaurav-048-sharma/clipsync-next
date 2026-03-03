import { NextRequest } from 'next/server';
import { getUserProfile, getUserAnalytics } from '@/lib/controllers/userController';

export async function GET(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  if (action === 'analytics') {
    return getUserAnalytics(username);
  }

  return getUserProfile(username);
}
