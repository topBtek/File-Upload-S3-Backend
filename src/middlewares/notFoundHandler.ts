import { Request, Response, NextFunction } from 'express';
import { NotFoundError } from '../utils/errors.js';

/**
 * 404 Not Found handler
 * Catches all unmatched routes
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  next(new NotFoundError(`Route ${req.method} ${req.path} not found`));
}
