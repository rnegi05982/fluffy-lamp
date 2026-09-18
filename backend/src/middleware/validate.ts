import type { Request, RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';

type Source = 'body' | 'query' | 'params';

/**
 * Runs a Zod schema against `req[source]` before the controller. On success the parsed
 * value is stashed on `req.validated[source]` (Express 5 makes `req.query` read-only, so
 * we don't reassign it). On failure the ZodError is forwarded to the central errorHandler.
 */
export function validate(schema: ZodTypeAny, source: Source = 'body'): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      next(result.error);
      return;
    }
    req.validated = { ...req.validated, [source]: result.data };
    next();
  };
}

/**
 * Typed accessor for validated input. Safe because `validate(schema, source)` ran for
 * this route; the single `as T` is the price of the middleware indirection.
 */
export function validated<T>(req: Request, source: Source): T {
  return req.validated?.[source] as T;
}
