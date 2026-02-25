import { z } from 'zod';
import mongoose from 'mongoose';

const objectId = z.string().refine(
  (val) => mongoose.Types.ObjectId.isValid(val),
  { message: 'Invalid ObjectId' }
);

export const createLocationSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or fewer').trim(),
    address: z.string().max(255, 'Address must be 255 characters or fewer').trim().optional(),
  }),
});

export const updateLocationSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    name: z.string().min(1).max(100).trim().optional(),
    address: z.string().max(255).trim().optional(),
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  }),
});

export const locationIdSchema = z.object({
  params: z.object({ id: objectId }),
});

export type CreateLocationInput = z.infer<typeof createLocationSchema>['body'];
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>['body'];
