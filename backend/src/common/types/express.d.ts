import 'express';

/**
 * Express request augmentation. The `validate` middleware stashes parsed/validated
 * input here rather than reassigning `req.query` (which is read-only in Express 5).
 */
declare global {
  namespace Express {
    interface Request {
      validated?: {
        body?: unknown;
        query?: unknown;
        params?: unknown;
      };
    }
  }
}
