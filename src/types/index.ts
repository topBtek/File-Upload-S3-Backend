/**
 * Core types for the S3 file upload service
 */

export interface PresignUploadRequest {
  filename: string;
  contentType: string;
  size?: number;
  metadata?: FileMetadata;
}

export interface PresignUploadResponse {
  uploadUrl: string;
  uploadMethod: 'PUT';
  key: string;
  expiresAt: string; // ISO 8601 timestamp
  fileId?: string;
}

export interface PresignGetResponse {
  url: string;
  expiresAt: string; // ISO 8601 timestamp
}

export interface FileMetadata {
  userId?: string;
  originalFilename?: string;
  tags?: string[];
  isPublic?: boolean;
  description?: string;
  [key: string]: unknown; // Allow additional custom metadata
}

export interface FileRecord {
  key: string;
  filename: string;
  contentType: string;
  size: number;
  metadata?: FileMetadata;
  uploadedAt: string;
  userId?: string;
}

export interface ListFilesQuery {
  userId?: string;
  tags?: string; // comma-separated
  page?: number;
  limit?: number;
  prefix?: string;
}

export interface ListFilesResponse {
  files: FileRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface UploadCompleteRequest {
  key: string;
  metadata?: FileMetadata;
}

export interface JwtPayload {
  userId: string;
  email?: string;
  [key: string]: unknown;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  details?: unknown;
}
