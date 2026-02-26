import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { jest } from '@jest/globals';
import routes from '../src/routes/index.js';
import { errorHandler } from '../src/middlewares/errorHandler.js';
import { notFoundHandler } from '../src/middlewares/notFoundHandler.js';
import { s3Service } from '../src/services/s3.service.js';

// Mock S3 service
jest.mock('../src/services/s3.service.js', () => ({
  s3Service: {
    generatePresignedUploadUrl: jest.fn(),
    generatePresignedGetUrl: jest.fn(),
    getFileMetadata: jest.fn(),
    deleteFile: jest.fn(),
    listFiles: jest.fn(),
  },
}));

describe('Upload Endpoints', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/', routes);
    app.use(notFoundHandler);
    app.use(errorHandler);
    jest.clearAllMocks();
  });

  describe('POST /upload/presign', () => {
    it('should generate presigned upload URL with valid request', async () => {
      const mockUrl = 'https://test-bucket.s3.amazonaws.com/test-key?signature=xyz';
      const mockExpiresAt = new Date(Date.now() + 900000);

      (s3Service.generatePresignedUploadUrl as jest.Mock).mockResolvedValue({
        url: mockUrl,
        expiresAt: mockExpiresAt,
      });

      const response = await request(app)
        .post('/upload/presign')
        .send({
          filename: 'test.jpg',
          contentType: 'image/jpeg',
          size: 1024,
        })
        .expect(200);

      expect(response.body).toHaveProperty('uploadUrl');
      expect(response.body).toHaveProperty('uploadMethod', 'PUT');
      expect(response.body).toHaveProperty('key');
      expect(response.body).toHaveProperty('expiresAt');
      expect(response.body).toHaveProperty('fileId');
    });

    it('should reject invalid content type', async () => {
      const response = await request(app)
        .post('/upload/presign')
        .send({
          filename: 'test.exe',
          contentType: 'application/x-msdownload', // Not allowed
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toContain('not allowed');
    });

    it('should reject file size exceeding limit', async () => {
      const response = await request(app)
        .post('/upload/presign')
        .send({
          filename: 'large.jpg',
          contentType: 'image/jpeg',
          size: 200 * 1024 * 1024, // 200 MB, assuming default limit is 100 MB
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toContain('exceeds maximum');
    });

    it('should accept metadata', async () => {
      const mockUrl = 'https://test-bucket.s3.amazonaws.com/test-key?signature=xyz';
      const mockExpiresAt = new Date(Date.now() + 900000);

      (s3Service.generatePresignedUploadUrl as jest.Mock).mockResolvedValue({
        url: mockUrl,
        expiresAt: mockExpiresAt,
      });

      const response = await request(app)
        .post('/upload/presign')
        .send({
          filename: 'test.jpg',
          contentType: 'image/jpeg',
          metadata: {
            userId: 'user123',
            tags: ['photo', 'profile'],
            isPublic: true,
          },
        })
        .expect(200);

      expect(response.body).toHaveProperty('uploadUrl');
      expect(s3Service.generatePresignedUploadUrl).toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/upload/presign')
        .send({
          // Missing filename and contentType
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /upload/complete', () => {
    it('should handle upload completion', async () => {
      (s3Service.getFileMetadata as jest.Mock).mockResolvedValue({
        exists: true,
        contentType: 'image/jpeg',
        size: 1024,
      });

      const response = await request(app)
        .post('/upload/complete')
        .send({
          key: 'test-key',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('key', 'test-key');
    });

    it('should reject completion for non-existent file', async () => {
      (s3Service.getFileMetadata as jest.Mock).mockResolvedValue({
        exists: false,
      });

      const response = await request(app)
        .post('/upload/complete')
        .send({
          key: 'non-existent-key',
        })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });
});
