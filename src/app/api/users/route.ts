import { NextRequest } from 'next/server';
import { getOwnProfile, createUserProfile, updateUserProfile, deleteUserProfile } from '@/lib/controllers/userController';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return getOwnProfile(req);
}

export async function POST(req: NextRequest) {
  return createUserProfile(req);
}

export async function PUT(req: NextRequest) {
  return updateUserProfile(req);
}

export async function DELETE(req: NextRequest) {
  return deleteUserProfile(req);
}
