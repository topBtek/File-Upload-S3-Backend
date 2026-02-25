import { Router } from 'express';
import { uploadController } from '../controllers/upload.controller.js';
import { validate } from '../middlewares/validation.js';
import { optionalAuthenticate } from '../middlewares/auth.js';
import {
  presignUploadSchema,
  uploadCompleteSchema,
} from '../schemas/upload.schemas.js';

const router = Router();

/**
 * POST /upload/presign
 * Generate presigned upload URL
 * Auth: Optional (if provided, userId is automatically added to metadata)
 */
router.post(
  '/presign',
  optionalAuthenticate,
  validate(presignUploadSchema),
  uploadController.generatePresignedUrl.bind(uploadController)
);

/**
 * POST /upload/complete
 * Handle upload completion callback
 * Auth: Optional
 */
router.post(
  '/complete',
  optionalAuthenticate,
  validate(uploadCompleteSchema),
  uploadController.handleUploadComplete.bind(uploadController)
);

export default router;
