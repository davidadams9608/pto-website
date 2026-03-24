import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { R2_BUCKET, r2Client } from './client';

/**
 * Generate a presigned PUT URL for uploading a file to R2.
 * Expires in 60 seconds.
 *
 * @param key - Object key, e.g. "newsletters/abc-123.pdf"
 * @param contentType - MIME type, e.g. "application/pdf"
 */
export async function generatePresignedUploadUrl(
  key: string,
  contentType: string,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(r2Client, command, { expiresIn: 60 });
}

/**
 * Generate a presigned GET URL for viewing/downloading a file from R2.
 * Expires in 1 hour (3600 seconds).
 *
 * @param key - Object key, e.g. "newsletters/abc-123.pdf"
 */
export async function generatePresignedDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
  });

  return getSignedUrl(r2Client, command, { expiresIn: 3600 });
}

/**
 * Delete an object from R2 by key.
 *
 * @param key - Object key, e.g. "newsletters/abc-123.pdf"
 */
export async function deleteObject(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
  });

  await r2Client.send(command);
}
