import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from './AppError';

/**
 * Generic validation middleware.
 *
 * Accepts a Zod schema that describes the shape of { body, params, query }.
 * Only define the fields you need — unspecified sections fall back to the
 * original request values.
 *
 * On success: replaces req.body / params / query with the parsed values.
 * On failure: forwards a 400 AppError with the first validation message.
 */
export function validate(schema: z.ZodType<any>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body:   req.body,
      params: req.params,
      query:  req.query,
    });

    if (!result.success) {
      const message = result.error.issues.map(i => i.message).join(', ');
      next(new AppError(message, 400));
      return;
    }

    if (result.data.body   !== undefined) req.body   = result.data.body;
    if (result.data.params !== undefined) req.params = result.data.params;
    if (result.data.query  !== undefined) req.query  = result.data.query;
    next();
  };
}
