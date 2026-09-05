import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors';
import { sendError } from '../lib/apiResponse';
import logger from '../lib/logger';

/**
 * Centralized error handler — catches all errors, returns standardized response.
 * Never leaks stack traces to the client in production.
 */
export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log the error with request context
  logger.error(
    {
      err,
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      ...(err instanceof AppError ? { statusCode: err.statusCode } : {}),
    },
    err.message
  );

  // Zod validation errors
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
    sendError(res, `Validation failed: ${details}`, 422);
    return;
  }

  // Known operational errors
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode);
    return;
  }

  // JSON parse errors
  if (err instanceof SyntaxError && 'body' in err) {
    sendError(res, 'Invalid JSON in request body', 400);
    return;
  }

  // Unknown errors — don't leak internals in production
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error';

  sendError(res, message, 500);
};
