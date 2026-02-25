import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Admin } from '../models/Admin.model';
import { AppError } from '../middleware/AppError';
import { catchAsync } from '../middleware/catchAsync';
import { env } from '../config/env';
import { LoginInput } from '../validation/auth.schemas';

const TOKEN_EXPIRY = '8h';

// POST /api/auth/login
export const login = catchAsync(async (req: Request, res: Response) => {
  const { username, password } = req.body as LoginInput;

  const admin = await Admin.findOne({ username });
  if (!admin) throw new AppError('Invalid credentials', 401);

  const valid = await admin.comparePassword(password);
  if (!valid) throw new AppError('Invalid credentials', 401);

  const token = jwt.sign({ adminId: admin._id, username: admin.username }, env.JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });

  res.status(200).json({ success: true, token });
});
