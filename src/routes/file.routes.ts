import { Router } from 'express';
import { fileController } from '../controllers/file.controller.js';
import { validate } from '../middlewares/validation.js';
import { optionalAuthenticate, authenticate } from '../middlewares/auth.js';
import {
  presignGetSchema,
  listFilesQuerySchema,
  deleteFileSchema,
} from '../schemas/upload.schemas.js';

const router = Router();

/**
 * GET /files/:key/presign
 * Generate presigned GET URL for private file access
 * Auth: Optional
 */
router.get(
  '/:key/presign',
  optionalAuthenticate,
  validate(presignGetSchema, 'params'),
  fileController.generatePresignedGetUrl.bind(fileController)
);

/**
 * GET /files
 * List files with pagination and filtering
 * Auth: Optional (if authenticated, filters by userId by default)
 */
router.get(
  '/',
  optionalAuthenticate,
  validate(listFilesQuerySchema, 'query'),
  fileController.listFiles.bind(fileController)
);

/**
 * DELETE /files/:key
 * Delete a file
 * Auth: Required
 */
router.delete(
  '/:key',
  authenticate,
  validate(deleteFileSchema, 'params'),
  fileController.deleteFile.bind(fileController)
);

export default router;
