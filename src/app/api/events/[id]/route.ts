import { NextRequest } from 'next/server';
import { getEvent, updateEvent, deleteEvent } from '@/lib/controllers/eventController';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return getEvent(req, id);
}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return updateEvent(req, id);
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return deleteEvent(req, id);
}
