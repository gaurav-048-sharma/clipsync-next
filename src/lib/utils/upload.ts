import { uploadToS3 } from '@/lib/config/s3';

const ALLOWED_TYPES = /image\/(jpeg|jpg|png|gif|webp)|video\/(mp4|quicktime|x-msvideo)/;
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export interface ParsedFile {
  buffer: Buffer;
  originalName: string;
  mimetype: string;
  size: number;
  location?: string;
  mediaType?: 'photo' | 'video';
}

export interface UploadedFiles {
  profilePicture?: ParsedFile[];
  video?: ParsedFile[];
  media?: ParsedFile[];
}

/**
 * Parse a multipart form data request and return the files and fields.
 * For Next.js App Router — uses the Web API FormData.
 */
export async function parseFormData(request: Request): Promise<{
  files: UploadedFiles;
  fields: Record<string, string>;
}> {
  const formData = await request.formData();
  const files: UploadedFiles = {};
  const fields: Record<string, string> = {};

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      if (!ALLOWED_TYPES.test(value.type)) {
        throw new Error('Only images (JPEG, PNG, GIF, WebP) and videos (MP4, MOV, AVI) are allowed');
      }
      if (value.size > MAX_FILE_SIZE) {
        throw new Error('File too large, max 100MB');
      }

      const buffer = Buffer.from(await value.arrayBuffer());
      const parsed: ParsedFile = {
        buffer,
        originalName: value.name,
        mimetype: value.type,
        size: value.size,
      };

      const fieldName = key as keyof UploadedFiles;
      if (!files[fieldName]) {
        files[fieldName] = [];
      }
      files[fieldName]!.push(parsed);
    } else {
      fields[key] = value as string;
    }
  }

  return { files, fields };
}

/**
 * Upload parsed files to S3 and attach location URLs.
 */
export async function uploadFilesToS3(files: UploadedFiles): Promise<UploadedFiles> {
  // Profile picture
  if (files.profilePicture?.[0]) {
    const f = files.profilePicture[0];
    f.location = await uploadToS3(f.buffer, f.originalName, f.mimetype, 'profile-pics');
  }

  // Video
  if (files.video?.[0]) {
    const f = files.video[0];
    f.location = await uploadToS3(f.buffer, f.originalName, f.mimetype, 'videos');
  }

  // Media (mixed photos/videos)
  if (files.media) {
    for (const f of files.media) {
      const isVideo = f.mimetype.startsWith('video/');
      const folder = isVideo ? 'videos' : 'photos';
      f.location = await uploadToS3(f.buffer, f.originalName, f.mimetype, folder);
      f.mediaType = isVideo ? 'video' : 'photo';
    }
  }

  return files;
}
