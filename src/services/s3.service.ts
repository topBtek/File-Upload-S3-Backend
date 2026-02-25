import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { S3Error } from '../utils/errors.js';
import type { FileMetadata } from '../types/index.js';

/**
 * S3 Service for managing file operations with presigned URLs
 */
export class S3Service {
  private client: S3Client;
  private bucketName: string;
  private prefix: string;

  constructor() {
    this.client = new S3Client({
      region: config.aws.region,
      credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      },
    });
    this.bucketName = config.aws.bucketName;
    this.prefix = config.aws.prefix;
  }

  /**
   * Generate a presigned PUT URL for direct client-to-S3 upload
   */
  async generatePresignedUploadUrl(
    key: string,
    contentType: string,
    metadata?: FileMetadata,
    maxSizeBytes?: number
  ): Promise<{ url: string; expiresAt: Date }> {
    try {
      const fullKey = `${this.prefix}${key}`;
      const expiresIn = config.presign.uploadExpirySeconds;

      // Build metadata headers
      const metadataHeaders: Record<string, string> = {};
      if (metadata) {
        // Store custom metadata (AWS S3 supports metadata with x-amz-meta- prefix)
        if (metadata.userId) metadataHeaders['x-amz-meta-user-id'] = metadata.userId;
        if (metadata.originalFilename)
          metadataHeaders['x-amz-meta-original-filename'] = encodeURIComponent(metadata.originalFilename);
        if (metadata.tags) metadataHeaders['x-amz-meta-tags'] = JSON.stringify(metadata.tags);
        if (metadata.isPublic !== undefined)
          metadataHeaders['x-amz-meta-is-public'] = metadata.isPublic.toString();
        if (metadata.description)
          metadataHeaders['x-amz-meta-description'] = encodeURIComponent(metadata.description);
      }

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fullKey,
        ContentType: contentType,
        ...metadataHeaders,
        // Add conditions to enforce content type and optional size limit
        ...(maxSizeBytes && { ContentLength: maxSizeBytes }),
      });

      const url = await getSignedUrl(this.client, command, { expiresIn });

      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

      logger.info(
        {
          key: fullKey,
          contentType,
          expiresIn,
        },
        'Generated presigned upload URL'
      );

      return { url, expiresAt };
    } catch (error) {
      logger.error({ error, key, contentType }, 'Failed to generate presigned upload URL');
      throw new S3Error('Failed to generate presigned upload URL', error);
    }
  }

  /**
   * Generate a presigned GET URL for private file access
   */
  async generatePresignedGetUrl(key: string): Promise<{ url: string; expiresAt: Date }> {
    try {
      const fullKey = `${this.prefix}${key}`;
      const expiresIn = config.presign.getExpirySeconds;

      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fullKey,
      });

      const url = await getSignedUrl(this.client, command, { expiresIn });

      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

      logger.info({ key: fullKey, expiresIn }, 'Generated presigned GET URL');

      return { url, expiresAt };
    } catch (error) {
      logger.error({ error, key }, 'Failed to generate presigned GET URL');
      throw new S3Error('Failed to generate presigned GET URL', error);
    }
  }

  /**
   * Delete a file from S3
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const fullKey = `${this.prefix}${key}`;

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: fullKey,
      });

      await this.client.send(command);

      logger.info({ key: fullKey }, 'Deleted file from S3');
    } catch (error) {
      logger.error({ error, key }, 'Failed to delete file from S3');
      throw new S3Error('Failed to delete file from S3', error);
    }
  }

  /**
   * Check if a file exists and get its metadata
   */
  async getFileMetadata(key: string): Promise<{
    exists: boolean;
    contentType?: string;
    size?: number;
    metadata?: FileMetadata;
    lastModified?: Date;
  }> {
    try {
      const fullKey = `${this.prefix}${key}`;

      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: fullKey,
      });

      const response = await this.client.send(command);

      // Extract custom metadata
      const metadata: FileMetadata = {};
      if (response.Metadata) {
        if (response.Metadata['user-id']) metadata.userId = response.Metadata['user-id'];
        if (response.Metadata['original-filename'])
          metadata.originalFilename = decodeURIComponent(response.Metadata['original-filename']);
        if (response.Metadata['tags']) metadata.tags = JSON.parse(response.Metadata['tags']);
        if (response.Metadata['is-public'])
          metadata.isPublic = response.Metadata['is-public'] === 'true';
        if (response.Metadata['description'])
          metadata.description = decodeURIComponent(response.Metadata['description']);
      }

      return {
        exists: true,
        contentType: response.ContentType,
        size: response.ContentLength,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        lastModified: response.LastModified,
      };
    } catch (error: unknown) {
      // If file doesn't exist, AWS returns 404
      if (error && typeof error === 'object' && 'name' in error && error.name === 'NotFound') {
        return { exists: false };
      }
      logger.error({ error, key }, 'Failed to get file metadata');
      throw new S3Error('Failed to get file metadata', error);
    }
  }

  /**
   * List files in the bucket (with pagination)
   */
  async listFiles(
    prefix?: string,
    maxKeys: number = 100,
    continuationToken?: string
  ): Promise<{
    files: Array<{
      key: string;
      size: number;
      lastModified: Date;
      contentType?: string;
    }>;
    nextContinuationToken?: string;
    isTruncated: boolean;
  }> {
    try {
      const searchPrefix = prefix ? `${this.prefix}${prefix}` : this.prefix;

      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: searchPrefix,
        MaxKeys: maxKeys,
        ContinuationToken: continuationToken,
      });

      const response = await this.client.send(command);

      const files =
        response.Contents?.map((object) => ({
          key: object.Key?.replace(this.prefix, '') || '',
          size: object.Size || 0,
          lastModified: object.LastModified || new Date(),
          contentType: undefined, // Would need HeadObject for each file to get this
        })) || [];

      return {
        files,
        nextContinuationToken: response.NextContinuationToken,
        isTruncated: response.IsTruncated || false,
      };
    } catch (error) {
      logger.error({ error, prefix }, 'Failed to list files');
      throw new S3Error('Failed to list files', error);
    }
  }
}

// Export singleton instance
export const s3Service = new S3Service();
