import { NextRequest } from 'next/server';
import { createExperience, getExperiences } from '@/lib/controllers/opportunityController';

// GET /api/opportunities/experiences
export async function GET(req: NextRequest) {
  return getExperiences(req);
}

// POST /api/opportunities/experiences
export async function POST(req: NextRequest) {
  return createExperience(req);
}
