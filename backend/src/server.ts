import type { Server } from 'node:http';
import { createApp } from './app';
import { env } from './config/env';
import { connectDB, disconnectDB } from './config/db';
import { logger } from './lib/logger';

/**
 * Boot order: validate env (on import of config/env) → connect DB → start HTTP. The cron
 * scheduler is wired in a later step. Graceful shutdown closes the HTTP server and the DB
 * connection.
 */
async function start(): Promise<void> {
  await connectDB();

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(`API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  setupGracefulShutdown(server);
}

function setupGracefulShutdown(server: Server): void {
  const shutdown = (signal: string): void => {
    logger.info(`${signal} received — shutting down`);
    server.close(() => {
      void disconnectDB().finally(() => process.exit(0));
    });
    // Force-exit if a connection keeps the server open too long.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((err) => {
  logger.error('Failed to start server', err);
  process.exit(1);
});
