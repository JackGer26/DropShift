import { z } from 'zod';
import mongoose from 'mongoose';

export const copyPreviousWeekSchema = z.object({
  body: z.object({
    locationId: z.string().refine(
      (val) => mongoose.Types.ObjectId.isValid(val),
      { message: 'Invalid locationId' }
    ),
    weekStartDate: z.string().regex(
      /^\d{4}-\d{2}-\d{2}$/,
      'weekStartDate must be in YYYY-MM-DD format'
    ),
  }),
});

// Inferred type for use in controllers — guarantees controller input matches schema
export type CopyPreviousWeekInput = z.infer<typeof copyPreviousWeekSchema>['body'];
