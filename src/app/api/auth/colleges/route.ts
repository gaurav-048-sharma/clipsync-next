import { getSupportedColleges } from '@/lib/controllers/authController';

export async function GET() {
  return getSupportedColleges();
}
