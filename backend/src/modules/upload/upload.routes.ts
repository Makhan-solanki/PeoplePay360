import { Router } from 'express';
import { getPresignedUrl, getDownloadUrl } from './upload.controller';
import { authenticate } from '../../middleware';

const router = Router();

// All upload routes require authentication
router.post('/presigned-url', authenticate, getPresignedUrl);
router.post('/download-url', authenticate, getDownloadUrl);

export default router;
