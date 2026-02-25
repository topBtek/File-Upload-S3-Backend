import { Request, Response } from 'express';
import { config } from '../config/env.js';

/**
 * Health Check Controller
 * GET /health
 */
export class HealthController {
  async check(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: config.server.nodeEnv,
      service: 's3-file-upload-backend',
    });
  }
}

export const healthController = new HealthController();
