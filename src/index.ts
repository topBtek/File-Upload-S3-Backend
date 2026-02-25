import express from 'express';
import pinoHttp from 'pino-http';
import { logger } from './utils/logger.js';
import { config } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFoundHandler } from './middlewares/notFoundHandler.js';

/**
 * Main application entry point
 */
async function main() {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging
  app.use(
    pinoHttp({
      logger,
      customLogLevel: (req, res, err) => {
        if (res.statusCode >= 400 && res.statusCode < 500) {
          return 'warn';
        } else if (res.statusCode >= 500 || err) {
          return 'error';
        }
        return 'info';
      },
    })
  );

  // Routes
  app.use('/', routes);

  // Error handling (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  // Start server
  const port = config.server.port;
  app.listen(port, () => {
    logger.info(
      {
        port,
        environment: config.server.nodeEnv,
        bucket: config.aws.bucketName,
      },
      '🚀 Server started successfully'
    );
  });
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.fatal({ error }, 'Uncaught exception');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.fatal({ reason, promise }, 'Unhandled rejection');
  process.exit(1);
});

// Start the application
main().catch((error) => {
  logger.fatal({ error }, 'Failed to start application');
  process.exit(1);
});
