// Signup route disabled — authentication is Microsoft-only
// import { NextRequest } from 'next/server';
// import { signup } from '@/lib/controllers/authController';

// export async function POST(req: NextRequest) {
//   return signup(req);
// }

import { NextResponse } from 'next/server';
export async function POST() {
  return NextResponse.json({ message: 'Signup is disabled. Please use Microsoft login.' }, { status: 403 });
}
