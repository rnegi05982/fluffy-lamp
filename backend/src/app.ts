import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { apiRouter } from './routes/index';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

/**
 * Assembles the Express app: security headers, CORS whitelist, JSON body limit, the
 * `/api` router, then the 404 + central error handlers last.
 */
export function createApp(): express.Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.corsOrigins }));
  app.use(express.json({ limit: '100kb' }));

  app.use('/api', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
