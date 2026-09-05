import { Response } from 'express';

export interface ApiResponseBody<T = unknown> {
  success: boolean;
  data: T | null;
  error: string | null;
}

/**
 * Send a standardized success response
 */
export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  const body: ApiResponseBody<T> = {
    success: true,
    data,
    error: null,
  };
  res.status(statusCode).json(body);
}

/**
 * Send a standardized error response
 */
export function sendError(res: Response, error: string, statusCode = 400): void {
  const body: ApiResponseBody = {
    success: false,
    data: null,
    error,
  };
  res.status(statusCode).json(body);
}

/**
 * Send a standardized paginated response
 */
export function sendPaginated<T>(
  res: Response,
  data: T[],
  meta: { page: number; limit: number; total: number },
  statusCode = 200
): void {
  const body = {
    success: true,
    data,
    meta: {
      ...meta,
      totalPages: Math.ceil(meta.total / meta.limit),
    },
    error: null,
  };
  res.status(statusCode).json(body);
}
