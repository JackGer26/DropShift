// Domain types
export type {
  DomainStaff,
  DomainShift,
  DomainDay,
  AssignmentRejection,
  AssignmentWarning,
  AssignmentValidation,
  AssignmentResult,
} from './types';

// Constants
export { MAX_WEEKLY_HOURS, NEAR_LIMIT_THRESHOLD } from './constants';

// Time utilities
export { toMinutes, calculateShiftDuration } from './timeUtils';

// Scheduling primitives
export { isOverlapping } from './isOverlapping';
export { calculateWeeklyHours } from './calculateWeeklyHours';
export { getSuggestedStaff } from './getSuggestedStaff';

// Assignment engine — the primary public API
export { validateAssignment, calculateWarnings, applyAssignment } from './assignmentEngine';
