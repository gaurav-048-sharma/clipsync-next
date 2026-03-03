import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export interface AuthUser {
  _id: string;
  email: string;
}

export interface AuthenticatedRequest extends NextRequest {
  user?: AuthUser;
}

export interface JwtPayload {
  id: string;
  email: string;
  iat: number;
  exp: number;
}

/**
 * Verifies the JWT token from an Authorization header and returns the authenticated user.
 * Use in Next.js API route handlers.
 */
export async function verifyAuth(req: NextRequest): Promise<AuthUser> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthError('Authentication token missing or malformed', 401);
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    throw new AuthError('No token provided', 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    return { _id: decoded.id, email: decoded.email };
  } catch (err: unknown) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AuthError('Token has expired', 401);
    }
    if (err instanceof jwt.JsonWebTokenError) {
      throw new AuthError('Invalid token', 401);
    }
    throw new AuthError('Authentication failed', 401);
  }
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'AuthError';
  }
}

/**
 * Helper to create an unauthorized response.
 */
export function unauthorizedResponse(message: string) {
  return NextResponse.json({ message }, { status: 401 });
}
