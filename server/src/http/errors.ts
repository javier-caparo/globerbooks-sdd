import type { NextFunction, Request, Response } from 'express';

/**
 * Typed application error carrying a machine-readable code and HTTP status.
 * Thrown by services; mapped to the standard error body by the Express
 * error middleware (design.md D7).
 */
export class AppError extends Error {
  readonly code: string;
  readonly httpStatus: number;
  readonly details?: Record<string, unknown>;

  constructor(code: string, message: string, httpStatus: number, details?: Record<string, unknown>) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.httpStatus = httpStatus;
    this.details = details;
  }
}

type ExpressError = Error & { status?: number };

/**
 * Express error middleware: AppError → its status and body;
 * malformed JSON → 400; anything else → generic 500 without stack leakage.
 */
export function errorHandler(err: ExpressError, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.httpStatus).json({
      error: err.message,
      code: err.code,
      timestamp: new Date().toISOString(),
      ...(err.details ?? {}),
    });
    return;
  }
  if (err instanceof SyntaxError && err.status === 400) {
    res.status(400).json({
      error: 'Request body must be valid JSON',
      code: 'VALIDATION_ERROR',
      timestamp: new Date().toISOString(),
    });
    return;
  }
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
  });
}
