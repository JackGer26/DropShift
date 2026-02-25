import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    username: z.string().min(1, 'Username is required').max(50).toLowerCase().trim(),
    password: z.string().min(1, 'Password is required').max(128),
  }),
});

export type LoginInput = z.infer<typeof loginSchema>['body'];
