import { z } from 'zod';

/**
 * Validation schemas for upload endpoints
 */

export const presignUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().min(1),
  size: z.number().int().positive().optional(),
  metadata: z
    .object({
      userId: z.string().optional(),
      originalFilename: z.string().optional(),
      tags: z.array(z.string()).optional(),
      isPublic: z.boolean().optional(),
      description: z.string().optional(),
    })
    .optional(),
});

export const presignGetSchema = z.object({
  key: z.string().min(1),
});

export const listFilesQuerySchema = z.object({
  userId: z.string().optional(),
  tags: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  prefix: z.string().optional(),
});

export const deleteFileSchema = z.object({
  key: z.string().min(1),
});

export const uploadCompleteSchema = z.object({
  key: z.string().min(1),
  metadata: z
    .object({
      userId: z.string().optional(),
      originalFilename: z.string().optional(),
      tags: z.array(z.string()).optional(),
      isPublic: z.boolean().optional(),
      description: z.string().optional(),
    })
    .optional(),
});
