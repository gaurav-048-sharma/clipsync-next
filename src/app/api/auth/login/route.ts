// Email/password login disabled — authentication is Microsoft-only
// import { NextRequest } from 'next/server';
// import { login } from '@/lib/controllers/authController';

// export async function POST(req: NextRequest) {
//   return login(req);
// }

import { NextResponse } from 'next/server';
export async function POST() {
  return NextResponse.json({ message: 'Email/password login is disabled. Please use Microsoft login.' }, { status: 403 });
}
