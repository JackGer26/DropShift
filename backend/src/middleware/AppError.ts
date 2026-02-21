export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    // Preserve V8 stack trace, excluding the constructor frame
    Error.captureStackTrace(this, this.constructor);
  }
}
