import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import BlacklistedToken from '@/lib/models/blacklistedToken';

/**
 * Checks if the JWT token has been blacklisted (e.g., after logout).
 * Returns null if token is valid, or a NextResponse if blacklisted.
 */
export async function checkBlacklist(req: NextRequest): Promise<NextResponse | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return null;

  const token = authHeader.split(' ')[1];
  if (!token) return null;

  await dbConnect();
  const blacklistedToken = await BlacklistedToken.findOne({ token });

  if (blacklistedToken) {
    return NextResponse.json({ error: 'Token is blacklisted' }, { status: 401 });
  }

  return null;
}
