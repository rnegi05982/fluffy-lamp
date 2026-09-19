import type { Server } from 'node:http';
import { createApp } from './app';
import { env } from './config/env';
import { connectDB, disconnectDB } from './config/db';
import { logger } from './lib/logger';
// import { startScheduler, stopScheduler } from './scheduler/worker';

/**
 * Boot order: validate env (on import of config/env) → connect DB → start HTTP → start the
 * cron scheduler. Graceful shutdown stops the scheduler and closes the HTTP + DB connections.
 */
async function start(): Promise<void> {
  await connectDB();

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(`API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  // startScheduler();
  setupGracefulShutdown(server);
}

function setupGracefulShutdown(server: Server): void {
  const shutdown = (signal: string): void => {
    logger.info(`${signal} received — shutting down`);
    // stopScheduler();
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
