import { Request, Response, NextFunction } from 'express';
import { fileService } from '../services/file.service.js';
import { logger } from '../utils/logger.js';
import type { PresignUploadRequest, UploadCompleteRequest } from '../types/index.js';

/**
 * Upload Controller
 * Handles presigned URL generation and upload completion
 */
export class UploadController {
  /**
   * Generate presigned upload URL
   * POST /upload/presign
   */
  async generatePresignedUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: PresignUploadRequest = req.body;

      // If user is authenticated, automatically add userId to metadata
      if (req.user?.userId && !request.metadata?.userId) {
        request.metadata = {
          ...request.metadata,
          userId: req.user.userId,
        };
      }

      const result = await fileService.generatePresignedUploadUrl(request);

      logger.info(
        {
          key: result.key,
          fileId: result.fileId,
          contentType: request.contentType,
        },
        'Presigned upload URL generated'
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle upload completion callback
   * POST /upload/complete
   */
  async handleUploadComplete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: UploadCompleteRequest = req.body;

      // If user is authenticated, verify ownership or add userId
      if (req.user?.userId) {
        request.metadata = {
          ...request.metadata,
          userId: req.user.userId,
        };
      }

      const result = await fileService.handleUploadComplete(request);

      logger.info({ key: result.key }, 'Upload completed');

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const uploadController = new UploadController();
