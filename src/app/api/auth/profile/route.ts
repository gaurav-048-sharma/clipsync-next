import { NextRequest } from 'next/server';
import { getOwnProfile, updateProfile, deleteAccount } from '@/lib/controllers/authController';

export async function GET(req: NextRequest) {
  return getOwnProfile(req);
}

export async function PUT(req: NextRequest) {
  return updateProfile(req);
}

export async function DELETE(req: NextRequest) {
  return deleteAccount(req);
}
