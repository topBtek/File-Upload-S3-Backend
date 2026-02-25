import { s3Service } from './s3.service.js';
import { config } from '../config/env.js';
import { generateFileId } from '../utils/id.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import type {
  PresignUploadRequest,
  PresignUploadResponse,
  PresignGetResponse,
  FileRecord,
  ListFilesQuery,
  ListFilesResponse,
  UploadCompleteRequest,
} from '../types/index.js';

/**
 * File Service - Business logic for file operations
 * Handles validation, metadata management, and coordinates with S3 service
 */
export class FileService {
  /**
   * Validate MIME type against allowed types
   */
  private validateMimeType(contentType: string): void {
    if (!config.upload.allAllowedTypes.includes(contentType)) {
      throw new ValidationError(
        `Content type ${contentType} is not allowed. Allowed types: ${config.upload.allAllowedTypes.join(', ')}`
      );
    }
  }

  /**
   * Validate file size
   */
  private validateFileSize(size?: number): void {
    if (size !== undefined && size > config.upload.maxFileSizeBytes) {
      throw new ValidationError(
        `File size ${size} bytes exceeds maximum allowed size of ${config.upload.maxFileSizeBytes} bytes (${config.upload.maxFileSizeMB} MB)`
      );
    }
  }

  /**
   * Generate a safe S3 key from filename
   */
  private generateSafeKey(filename: string, fileId?: string): string {
    // Remove path separators and sanitize filename
    const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const timestamp = Date.now();
    const id = fileId || generateFileId();
    return `${timestamp}-${id}-${sanitized}`;
  }

  /**
   * Generate presigned upload URL
   */
  async generatePresignedUploadUrl(
    request: PresignUploadRequest
  ): Promise<PresignUploadResponse> {
    // Validate MIME type
    this.validateMimeType(request.contentType);

    // Validate file size if provided
    this.validateFileSize(request.size);

    // Generate file ID and key
    const fileId = generateFileId();
    const key = this.generateSafeKey(request.filename, fileId);

    // Generate presigned URL
    const { url, expiresAt } = await s3Service.generatePresignedUploadUrl(
      key,
      request.contentType,
      {
        ...request.metadata,
        originalFilename: request.filename,
      },
      request.size
    );

    return {
      uploadUrl: url,
      uploadMethod: 'PUT',
      key,
      expiresAt: expiresAt.toISOString(),
      fileId,
    };
  }

  /**
   * Generate presigned GET URL for private file access
   */
  async generatePresignedGetUrl(key: string): Promise<PresignGetResponse> {
    // Verify file exists
    const metadata = await s3Service.getFileMetadata(key);
    if (!metadata.exists) {
      throw new NotFoundError(`File with key ${key} not found`);
    }

    const { url, expiresAt } = await s3Service.generatePresignedGetUrl(key);

    return {
      url,
      expiresAt: expiresAt.toISOString(),
    };
  }

  /**
   * List files with pagination and filtering
   * Note: In a production system, you'd likely store file metadata in a database
   * for efficient querying. This is a simplified version using S3 list operations.
   */
  async listFiles(query: ListFilesQuery): Promise<ListFilesResponse> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const prefix = query.prefix || '';

    const result = await s3Service.listFiles(prefix, limit);

    // Filter by userId if provided (would need metadata lookup in production)
    // For now, we'll return all files. In production, store metadata in DB.
    let files: FileRecord[] = result.files.map((file) => ({
      key: file.key,
      filename: file.key.split('-').slice(2).join('-'), // Extract original filename from key
      contentType: file.contentType || 'application/octet-stream',
      size: file.size,
      uploadedAt: file.lastModified.toISOString(),
    }));

    // Simple tag filtering (would need proper metadata storage in production)
    if (query.tags) {
      const tagList = query.tags.split(',').map((t) => t.trim());
      // In production, filter based on stored metadata
      // For now, this is a placeholder
    }

    return {
      files,
      pagination: {
        page,
        limit,
        total: files.length, // In production, get from database
        hasMore: result.isTruncated,
      },
    };
  }

  /**
   * Delete a file
   */
  async deleteFile(key: string): Promise<void> {
    // Verify file exists
    const metadata = await s3Service.getFileMetadata(key);
    if (!metadata.exists) {
      throw new NotFoundError(`File with key ${key} not found`);
    }

    await s3Service.deleteFile(key);
  }

  /**
   * Handle upload completion callback
   * In production, this would store file metadata in a database
   * and trigger post-processing tasks (thumbnails, transcoding, etc.)
   */
  async handleUploadComplete(request: UploadCompleteRequest): Promise<{
    success: boolean;
    message: string;
    key: string;
  }> {
    // Verify file exists in S3
    const metadata = await s3Service.getFileMetadata(request.key);
    if (!metadata.exists) {
      throw new NotFoundError(`File with key ${request.key} not found`);
    }

    // In production, you would:
    // 1. Store file metadata in database
    // 2. Trigger post-processing (thumbnails, video transcoding, etc.)
    // 3. Send webhooks/notifications
    // 4. Update user quotas, etc.

    // For now, we'll just log and return success
    // This is where you'd integrate with your database and job queue

    return {
      success: true,
      message: 'Upload completed successfully',
      key: request.key,
    };
  }
}

// Export singleton instance
export const fileService = new FileService();
