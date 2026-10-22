import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';
import path from 'path';

// Load .env explicitly relative to current file directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const endpoint = process.env.S3_ENDPOINT;
if (!endpoint) {
  console.warn('⚠️ S3_ENDPOINT is not defined in environment variables.');
}

export const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  endpoint: endpoint,
  forcePathStyle: true, // Required for Supabase / S3 path-style bucket routing
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'evidence-vault';

/**
 * Task 1 & 2: Generates a presigned PUT URL for direct frontend uploads to private S3 storage.
 */
export async function getUploadPresignedUrl(fileKey: string, contentType: string, expiresInSeconds = 900): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
    ContentType: contentType,
  });

  return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}

/**
 * Generates a presigned GET URL to safely view private S3 files in the UI.
 */
export async function getDownloadPresignedUrl(fileKey: string, expiresInSeconds = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
  });

  return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}