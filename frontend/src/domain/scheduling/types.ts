/**
 * Domain-only types for the scheduling engine.
 *
 * No React. No Mongo. No application-level imports.
 *
 * These interfaces describe only what the scheduling functions
 * need to do their work. Application types (Staff, RotaShift, RotaDay)
 * are NOT automatically compatible — callers must map them explicitly.
 * That mapping is intentional: it keeps the boundary visible.
 */

/** Minimum staff record the engine needs */
export interface DomainStaff {
  id: string;   // domain-neutral identifier — not _id
  name: string;
  role: string;
}

/** Minimum shift record the engine needs */
export interface DomainShift {
  id: string;
  shiftTemplateId: string;
  startTime: string;
  endTime: string;
  roleRequired: string;
  quantityRequired: number;
  assignedStaffIds: string[];
}

/** A single day's scheduling data */
export interface DomainDay {
  dayOfWeek: number;
  shifts: DomainShift[];
}

// ---------------------------------------------------------------------------
// Hard-constraint types (blocking — assignment is rejected outright)
// ---------------------------------------------------------------------------

/** Reasons an assignment is rejected */
export type AssignmentRejection =
  | 'ROLE_MISMATCH'
  | 'SLOT_FULL'
  | 'ALREADY_ASSIGNED'
  | 'OVERLAPPING_SHIFT'
  | 'SHIFT_NOT_FOUND';

/**
 * Result of validateAssignment.
 * Hard constraints only — no soft warnings.
 */
export interface AssignmentValidation {
  valid: boolean;
  rejection?: AssignmentRejection;
}

// ---------------------------------------------------------------------------
// Soft-constraint types (non-blocking — assignment can still proceed)
// ---------------------------------------------------------------------------

/** Non-blocking warnings to surface to the UI */
export type AssignmentWarning =
  | 'EXCEEDS_WEEKLY_HOURS'
  | 'NEAR_WEEKLY_LIMIT';

// ---------------------------------------------------------------------------
// Assignment result
// ---------------------------------------------------------------------------

/**
 * Outcome of applyAssignment.
 *
 * On success: the immutably updated day array.
 * On failure: the rejection reason.
 *
 * Warnings are NOT included here — call calculateWarnings() separately
 * before committing the assignment.
 */
export type AssignmentResult =
  | { success: true; updatedDays: DomainDay[] }
  | { success: false; reason: AssignmentRejection };
