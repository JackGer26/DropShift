import { z } from 'zod';
import mongoose from 'mongoose';

const objectId = z.string().refine(
  (val) => mongoose.Types.ObjectId.isValid(val),
  { message: 'Invalid ObjectId' }
);


export const createStaffSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or fewer').trim(),
    role: z.string().min(1, 'Role is required').max(50, 'Role must be 50 characters or fewer').trim(),
    contractedHours: z.number()
      .min(0, 'contractedHours cannot be negative')
      .max(168, 'contractedHours cannot exceed 168 (hours in a week)'),
    locationIds: z.array(objectId).optional().default([]),
  }),
});

export const updateStaffSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    name: z.string().min(1).max(100).trim().optional(),
    role: z.string().min(1).max(50).trim().optional(),
    contractedHours: z.number().min(0).max(168).optional(),
    locationIds: z.array(objectId).optional(),
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  }),
});

export const staffIdSchema = z.object({
  params: z.object({ id: objectId }),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>['body'];
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>['body'];
