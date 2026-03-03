import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, AuthError } from '@/lib/middleware/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    await verifyAuth(req);

    const formData = await req.formData();
    const media = formData.get('media') as File | null;
    if (!media) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 });
    }

    const bytes = await media.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const ext = media.name.split('.').pop() || 'jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'messages');
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const imageUrl = `/uploads/messages/${filename}`;
    return NextResponse.json({ imageUrl }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ message: (err as AuthError).message }, { status: (err as AuthError).status });
    }
    console.error('Upload error:', err);
    return NextResponse.json({ message: 'Failed to upload file' }, { status: 500 });
  }
}
