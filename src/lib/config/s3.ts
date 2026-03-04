import { S3Client, PutObjectCommand, ListBucketsCommand } from '@aws-sdk/client-s3';
import path from 'path';

/* .trim() all env vars — Vercel can carry trailing \r\n from copy-paste */
const awsRegion   = (process.env.AWS_REGION || 'ap-south-1').trim();
const awsKey      = (process.env.AWS_ACCESS_KEY_ID || '').trim();
const awsSecret   = (process.env.AWS_SECRET_ACCESS_KEY || '').trim();
const bucketName  = (process.env.S3_BUCKET_NAME || '').trim();

const s3Client = new S3Client({
  region: awsRegion,
  credentials: {
    accessKeyId: awsKey,
    secretAccessKey: awsSecret,
  },
});

/**
 * Upload a file buffer to S3 and return the public URL.
 */
export async function uploadToS3(
  buffer: Buffer,
  originalName: string,
  mimetype: string,
  folder: string
): Promise<string> {
  const key = `${folder}/${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(originalName)}`;
  const region = awsRegion;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: mimetype,
  });

  await s3Client.send(command);

  return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
}

/**
 * Test S3 connection (call once at startup if needed).
 */
export async function testS3Connection(): Promise<boolean> {
  try {
    await s3Client.send(new ListBucketsCommand({}));
    return true;
  } catch {
    return false;
  }
}

export { s3Client };
