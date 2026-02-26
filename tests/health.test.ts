import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeEach } from '@jest/globals';
import routes from '../src/routes/index.js';
import { errorHandler } from '../src/middlewares/errorHandler.js';
import { notFoundHandler } from '../src/middlewares/notFoundHandler.js';

describe('Health Check', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/', routes);
    app.use(notFoundHandler);
    app.use(errorHandler);
  });

  it('should return health status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('environment');
    expect(response.body).toHaveProperty('service', 's3-file-upload-backend');
  });
});
