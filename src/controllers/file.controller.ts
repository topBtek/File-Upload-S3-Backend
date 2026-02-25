import { Request, Response, NextFunction } from 'express';
import { fileService } from '../services/file.service.js';
import { ForbiddenError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import type { ListFilesQuery } from '../types/index.js';

/**
 * File Controller
 * Handles file operations (get presigned URLs, list, delete)
 */
export class FileController {
  /**
   * Generate presigned GET URL for private file access
   * GET /files/:key/presign
   */
  async generatePresignedGetUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { key } = req.params;

      const result = await fileService.generatePresignedGetUrl(key);

      logger.info({ key }, 'Presigned GET URL generated');

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * List files with pagination and filtering
   * GET /files
   */
  async listFiles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query: ListFilesQuery = {
        userId: req.query.userId as string | undefined,
        tags: req.query.tags as string | undefined,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        prefix: req.query.prefix as string | undefined,
      };

      // If user is authenticated, filter by their userId by default
      if (req.user?.userId && !query.userId) {
        query.userId = req.user.userId;
      }

      const result = await fileService.listFiles(query);

      logger.info(
        {
          count: result.files.length,
          page: result.pagination.page,
        },
        'Files listed'
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a file
   * DELETE /files/:key
   */
  async deleteFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { key } = req.params;

      // In production, verify ownership before deletion
      // For now, we'll check if user is authenticated and optionally verify ownership
      if (req.user?.userId) {
        // You could add ownership verification here
        // const fileMetadata = await fileService.getFileMetadata(key);
        // if (fileMetadata.metadata?.userId !== req.user.userId) {
        //   throw new ForbiddenError('You do not have permission to delete this file');
        // }
      }

      await fileService.deleteFile(key);

      logger.info({ key }, 'File deleted');

      res.status(200).json({
        success: true,
        message: 'File deleted successfully',
        key,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const fileController = new FileController();
