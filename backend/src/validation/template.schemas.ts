import { z } from 'zod';
import mongoose from 'mongoose';

const objectId = z.string().refine(
  (val) => mongoose.Types.ObjectId.isValid(val),
  { message: 'Invalid ObjectId' }
);

const shiftSchema = z.object({
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'startTime must be in HH:MM format'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'endTime must be in HH:MM format'),
  roleRequired: z.string().min(1).max(50).trim(),
  quantityRequired: z.number().int().min(1).max(50),
});

const daySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  shifts: z.array(shiftSchema).max(20, 'A day cannot have more than 20 shifts'),
});

export const createTemplateSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or fewer').trim(),
    locationId: objectId.optional(),
    days: z.array(daySchema).max(7, 'A template cannot have more than 7 days'),
  }),
});

export const updateTemplateSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    name: z.string().min(1).max(100).trim().optional(),
    locationId: objectId.optional(),
    days: z.array(daySchema).max(7).optional(),
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  }),
});

export const templateIdSchema = z.object({
  params: z.object({ id: objectId }),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>['body'];
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>['body'];
