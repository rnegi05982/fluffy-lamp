/**
 * The single error type services throw for known/operational errors.
 * `code` is a stable string the frontend can branch on (e.g. `STORE_NOT_FOUND`,
 * `DUPLICATE_STORE_NAME`, `INVALID_RULE`). The central errorHandler maps it to the
 * `{ error: { code, message, details? } }` envelope.
 */
export type ApiErrorDetails = Record<string, unknown>;

export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: ApiErrorDetails;

  constructor(statusCode: number, code: string, message: string, details?: ApiErrorDetails) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    // Keep the stack trace pointing at the throw site, not this constructor.
    Error.captureStackTrace?.(this, ApiError);
  }

  static notFound(code: string, message: string, details?: ApiErrorDetails): ApiError {
    return new ApiError(404, code, message, details);
  }

  static badRequest(code: string, message: string, details?: ApiErrorDetails): ApiError {
    return new ApiError(400, code, message, details);
  }

  static conflict(code: string, message: string, details?: ApiErrorDetails): ApiError {
    return new ApiError(409, code, message, details);
  }
}
