import { generateToken } from '../middlewares/auth.js';
import type { JwtPayload } from '../types/index.js';

/**
 * Helper function to generate JWT tokens for testing/demo
 * In production, this would be part of an authentication service
 */
export function createTestToken(payload: Partial<JwtPayload> = {}): string {
  const defaultPayload: JwtPayload = {
    userId: 'test-user-123',
    email: 'test@example.com',
    ...payload,
  };

  return generateToken(defaultPayload);
}
