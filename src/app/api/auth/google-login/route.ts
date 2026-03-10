// Google login route disabled — authentication is Microsoft-only
// import { NextRequest } from 'next/server';
// import { googleLogin } from '@/lib/controllers/authController';

// export async function POST(req: NextRequest) {
//   return googleLogin(req);
// }

import { NextResponse } from 'next/server';
export async function POST() {
  return NextResponse.json({ message: 'Google login is disabled. Please use Microsoft login.' }, { status: 403 });
}
