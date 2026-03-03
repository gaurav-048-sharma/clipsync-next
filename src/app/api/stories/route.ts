import { NextRequest } from 'next/server';
import { getStories, createStory } from '@/lib/controllers/storyController';

export async function GET(req: NextRequest) { return getStories(req); }
export async function POST(req: NextRequest) { return createStory(req); }
