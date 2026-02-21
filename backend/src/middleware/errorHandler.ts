import { Request, Response, NextFunction } from 'express';
import { AppError } from './AppError';

const isProd = process.env.NODE_ENV === 'production';

// Express requires the 4-parameter signature to recognise this as error middleware
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    // Operational errors: safe to expose the message to the client
    console.error(`[AppError] ${err.statusCode} ${err.message}`);
    res.status(err.statusCode).json({ success: false, message: err.message });
    return;
  }

  // Programming / unexpected errors: never expose internals in production
  console.error('[UnhandledError]', err);
  res.status(500).json({
    success: false,
    message: isProd ? 'An unexpected error occurred' : err.message,
  });
}
