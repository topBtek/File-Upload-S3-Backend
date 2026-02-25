import pino from 'pino';
import { config } from '../config/env.js';

/**
 * Structured logger using Pino
 * Configured based on environment variables
 */
export const logger = pino({
  level: config.logging.level,
  transport:
    config.server.nodeEnv === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
});
