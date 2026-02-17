import { RotaDay } from '../../types/rota';

/** Reasons an assignment can be rejected */
export type AssignmentRejection =
  | 'ROLE_MISMATCH'
  | 'SLOT_FULL'
  | 'ALREADY_ASSIGNED'
  | 'OVERLAPPING_SHIFT';

/** Non-blocking warnings to surface to the UI */
export type AssignmentWarning =
  | 'EXCEEDS_WEEKLY_HOURS'
  | 'NEAR_WEEKLY_LIMIT';

/** Result of validating whether an assignment is allowed */
export interface AssignmentValidation {
  valid: boolean;
  rejection?: AssignmentRejection;
  warnings: AssignmentWarning[];
}

/** Outcome of attempting to apply an assignment */
export type AssignmentResult =
  | { success: true; updatedDays: RotaDay[]; warnings: AssignmentWarning[] }
  | { success: false; reason: AssignmentRejection; warnings: AssignmentWarning[] };
