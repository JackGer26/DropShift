import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from './AppError';

interface JwtPayload {
  adminId: string;
  username: string;
}

// Augment Express Request to carry the decoded admin
declare module 'express-serve-static-core' {
  interface Request {
    admin?: JwtPayload;
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(new AppError('Authentication required', 401));
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.admin = payload;
    next();
  } catch {
    next(new AppError('Invalid or expired token', 401));
  }
}
