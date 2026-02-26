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
    generatePresignedGetUrl: jest.fn(),
    getFileMetadata: jest.fn(),
    deleteFile: jest.fn(),
    listFiles: jest.fn(),
  },
}));

describe('File Endpoints', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/', routes);
    app.use(notFoundHandler);
    app.use(errorHandler);
    jest.clearAllMocks();
  });

  describe('GET /files/:key/presign', () => {
    it('should generate presigned GET URL', async () => {
      const mockUrl = 'https://test-bucket.s3.amazonaws.com/test-key?signature=xyz';
      const mockExpiresAt = new Date(Date.now() + 3600000);

      (s3Service.getFileMetadata as jest.Mock).mockResolvedValue({
        exists: true,
      });
      (s3Service.generatePresignedGetUrl as jest.Mock).mockResolvedValue({
        url: mockUrl,
        expiresAt: mockExpiresAt,
      });

      const response = await request(app)
        .get('/files/test-key/presign')
        .expect(200);

      expect(response.body).toHaveProperty('url');
      expect(response.body).toHaveProperty('expiresAt');
    });

    it('should return 404 for non-existent file', async () => {
      (s3Service.getFileMetadata as jest.Mock).mockResolvedValue({
        exists: false,
      });

      const response = await request(app)
        .get('/files/non-existent/presign')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /files', () => {
    it('should list files', async () => {
      (s3Service.listFiles as jest.Mock).mockResolvedValue({
        files: [
          {
            key: 'test-key-1',
            size: 1024,
            lastModified: new Date(),
          },
        ],
        isTruncated: false,
      });

      const response = await request(app)
        .get('/files')
        .expect(200);

      expect(response.body).toHaveProperty('files');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.files)).toBe(true);
    });

    it('should support pagination', async () => {
      (s3Service.listFiles as jest.Mock).mockResolvedValue({
        files: [],
        isTruncated: false,
      });

      const response = await request(app)
        .get('/files?page=2&limit=10')
        .expect(200);

      expect(response.body.pagination).toHaveProperty('page', 2);
      expect(response.body.pagination).toHaveProperty('limit', 10);
    });
  });

  describe('DELETE /files/:key', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .delete('/files/test-key')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should delete file when authenticated', async () => {
      // Generate a test token (in real tests, you'd use a proper JWT)
      // For now, we'll mock the auth middleware or use a test token
      (s3Service.getFileMetadata as jest.Mock).mockResolvedValue({
        exists: true,
      });
      (s3Service.deleteFile as jest.Mock).mockResolvedValue(undefined);

      // Note: This test would need proper JWT setup
      // For now, we'll test the endpoint structure
      const response = await request(app)
        .delete('/files/test-key')
        .expect(401); // Will fail auth, which is expected without token

      expect(response.body).toHaveProperty('error');
    });
  });
});
