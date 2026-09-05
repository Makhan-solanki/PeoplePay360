import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { uploadService } from './upload.service';
import { sendSuccess, sendError } from '../../lib/apiResponse';

const uploadUrlSchema = z.object({
  filename: z.string().min(1, 'Filename is required'),
  contentType: z.string().min(1, 'Content type is required'),
});

/**
 * POST /api/upload/presigned-url
 * Returns a presigned S3 URL for direct client upload.
 */
export async function getPresignedUrl(req: Request, res: Response, next: NextFunction) {
  try {
    if (!uploadService.isConfigured()) {
      return sendError(res, 'File upload is not configured. Set AWS credentials.', 503);
    }

    const { filename, contentType } = uploadUrlSchema.parse(req.body);
    const key = `uploads/${Date.now()}-${filename}`;
    const uploadUrl = await uploadService.getUploadUrl(key, contentType);

    sendSuccess(res, { uploadUrl, key });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/upload/download-url
 * Returns a presigned S3 URL for downloading a file.
 */
export async function getDownloadUrl(req: Request, res: Response, next: NextFunction) {
  try {
    if (!uploadService.isConfigured()) {
      return sendError(res, 'File upload is not configured. Set AWS credentials.', 503);
    }

    const { key } = z.object({ key: z.string().min(1) }).parse(req.body);
    const downloadUrl = await uploadService.getDownloadUrl(key);

    sendSuccess(res, { downloadUrl });
  } catch (error) {
    next(error);
  }
}
