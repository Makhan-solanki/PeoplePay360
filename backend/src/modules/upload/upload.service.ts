import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../../config/env';
import { AppError } from '../../lib/errors';

/**
 * S3 Upload Service — Generates presigned URLs for direct client uploads.
 * This avoids routing large files through the backend.
 */
export class UploadService {
  private s3Client: S3Client | null = null;
  private bucket: string;

  constructor() {
    this.bucket = env.AWS_S3_BUCKET;

    if (env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && env.AWS_S3_BUCKET) {
      this.s3Client = new S3Client({
        region: env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: env.AWS_ACCESS_KEY_ID,
          secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        },
      });
    }
  }

  /**
   * Check if S3 is configured and available.
   */
  isConfigured(): boolean {
    return this.s3Client !== null;
  }

  /**
   * Generate a presigned URL for uploading a file.
   * Client uploads directly to S3 using this URL.
   */
  async getUploadUrl(key: string, contentType: string, expiresIn = 3600): Promise<string> {
    if (!this.s3Client) {
      throw new AppError('S3 is not configured. Set AWS credentials in environment.', 503);
    }

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Generate a presigned URL for downloading/viewing a file.
   */
  async getDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    if (!this.s3Client) {
      throw new AppError('S3 is not configured. Set AWS credentials in environment.', 503);
    }

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }
}

export const uploadService = new UploadService();
