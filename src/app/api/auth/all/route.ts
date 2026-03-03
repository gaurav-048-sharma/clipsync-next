import { getAllUsers } from '@/lib/controllers/authController';

export async function GET() {
  return getAllUsers();
}
