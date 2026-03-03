import { NextRequest } from 'next/server';
import { getCategories } from '@/lib/controllers/eventController';

export async function GET() { return getCategories(); }
