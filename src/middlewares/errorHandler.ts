import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/env.js';
import type { ApiError } from '../types/index.js';

/**
 * Global error handling middleware
 * Converts errors to consistent JSON API error format
 */
export function errorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error
  logger.error(
    {
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
    },
    'Request error'
  );

  // Handle known error types
  if (error instanceof AppError) {
    const apiError: ApiError = {
      error: error.name,
      message: error.message,
      statusCode: error.statusCode,
      ...(error.details && { details: error.details }),
    };

    return res.status(error.statusCode).json(apiError);
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const apiError: ApiError = {
      error: 'ValidationError',
      message: 'Validation failed',
      statusCode: 400,
      details: error.errors.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
      })),
    };

    return res.status(400).json(apiError);
  }

  // Handle unknown errors
  const apiError: ApiError = {
    error: 'InternalServerError',
    message: config.server.nodeEnv === 'production' ? 'Internal server error' : error.message,
    statusCode: 500,
  };

  res.status(500).json(apiError);
}
