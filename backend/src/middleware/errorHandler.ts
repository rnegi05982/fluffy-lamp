import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../lib/ApiError';
import { logger } from '../lib/logger';
import { env } from '../config/env';

/** Catch-all for unmatched routes → 404 in the standard error envelope. */
export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    },
  });
};

/**
 * Central error middleware (must keep the 4-arg signature). Maps known ApiError and
 * ZodError to the `{ error: { code, message, details? } }` envelope; anything else is a
 * 500 with internals hidden in production.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: err.flatten(),
      },
    });
    return;
  }

  logger.error('Unhandled error', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: env.isProd
        ? 'Internal server error'
        : err instanceof Error
          ? err.message
          : 'Unknown error',
    },
  });
};
