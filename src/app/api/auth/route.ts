import { NextRequest } from 'next/server';
import { signup, login, getAllUsers, searchUsers, getSupportedColleges, googleLogin, microsoftLogin, logout, getOwnProfile, updateProfile, deleteAccount } from '@/lib/controllers/authController';

// POST /api/auth — handles signup, login, google-login, microsoft-login, logout via action param
// GET /api/auth — handles all, search, colleges, profile
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  switch (action) {
    case 'signup': return signup(req);
    case 'login': return login(req);
    case 'google-login': return googleLogin(req);
    case 'microsoft-login': return microsoftLogin(req);
    case 'logout': return logout(req);
    default: return signup(req); // default POST is signup
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  switch (action) {
    case 'all': return getAllUsers();
    case 'search': return searchUsers(req);
    case 'colleges': return getSupportedColleges();
    case 'profile': return getOwnProfile(req);
    default: return getAllUsers();
  }
}

export async function PUT(req: NextRequest) {
  return updateProfile(req);
}

export async function DELETE(req: NextRequest) {
  return deleteAccount(req);
}
