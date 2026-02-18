import { DomainStaff, DomainShift, DomainDay, AssignmentValidation, AssignmentWarning, AssignmentResult } from './types';
import { isOverlapping } from './isOverlapping';
import { calculateShiftDuration } from './timeUtils';
import { MAX_WEEKLY_HOURS, NEAR_LIMIT_THRESHOLD } from './constants';

// ---------------------------------------------------------------------------
// validateAssignment — hard constraints only
// ---------------------------------------------------------------------------

/**
 * Check whether a staff member can be assigned to a specific shift.
 *
 * Evaluates hard constraints only (blocking):
 *   1. Role mismatch
 *   2. Slot at capacity
 *   3. Staff already assigned to this shift
 *   4. Staff assigned to an overlapping shift on the same day
 *
 * Does NOT check weekly hours — call calculateWarnings() for soft constraints.
 * Does NOT require allDays — every check is scoped to the given shift and day.
 *
 * Pure function — no side effects, no mutation.
 */
export function validateAssignment(
  staff: DomainStaff,
  shift: DomainShift,
  day: DomainDay,
): AssignmentValidation {
  if (staff.role !== shift.roleRequired) {
    return { valid: false, rejection: 'ROLE_MISMATCH' };
  }

  if (shift.assignedStaffIds.length >= shift.quantityRequired) {
    return { valid: false, rejection: 'SLOT_FULL' };
  }

  if (shift.assignedStaffIds.includes(staff.id)) {
    return { valid: false, rejection: 'ALREADY_ASSIGNED' };
  }

  const hasOverlap = day.shifts.some(s => {
    if (s.shiftTemplateId === shift.shiftTemplateId) return false;
    if (!s.assignedStaffIds.includes(staff.id)) return false;
    if (!s.startTime || !s.endTime || !shift.startTime || !shift.endTime) return false;
    return isOverlapping(s.startTime, s.endTime, shift.startTime, shift.endTime);
  });
  if (hasOverlap) {
    return { valid: false, rejection: 'OVERLAPPING_SHIFT' };
  }

  return { valid: true };
}

// ---------------------------------------------------------------------------
// calculateWarnings — soft constraints only
// ---------------------------------------------------------------------------

/**
 * Calculate non-blocking warnings for a potential assignment.
 *
 * Accepts the staff member's current weekly hours as a plain number,
 * so the caller controls when and how often calculateWeeklyHours() runs.
 * This avoids redundant recalculation when the caller already has the map.
 *
 * Call after validateAssignment returns valid: true.
 * Returns an empty array when no soft constraint is triggered.
 *
 * Pure function — no side effects, no mutation.
 */
export function calculateWarnings(
  shift: DomainShift,
  currentHours: number,
): AssignmentWarning[] {
  if (!shift.startTime || !shift.endTime) return [];

  const projected = currentHours + calculateShiftDuration(shift.startTime, shift.endTime);

  if (projected > MAX_WEEKLY_HOURS) return ['EXCEEDS_WEEKLY_HOURS'];
  if (projected >= MAX_WEEKLY_HOURS * NEAR_LIMIT_THRESHOLD) return ['NEAR_WEEKLY_LIMIT'];
  return [];
}

// ---------------------------------------------------------------------------
// applyAssignment — pure state transition
// ---------------------------------------------------------------------------

/**
 * Immutably append a staff assignment to the rota.
 *
 * Locates the target shift by shiftTemplateId, then returns a new day array
 * with the staffId appended to that shift's assignedStaffIds.
 *
 * DOES NOT validate — the caller is responsible for running validateAssignment
 * and calculateWarnings before calling this. Keeping the commit step free of
 * validation logic makes each function independently testable and allows the
 * UI to decide when and how to present errors or warnings.
 *
 * Returns SHIFT_NOT_FOUND if the shiftTemplateId cannot be located.
 *
 * Pure function — no side effects, no mutation.
 */
export function applyAssignment(
  staffId: string,
  shiftTemplateId: string,
  allDays: DomainDay[],
): AssignmentResult {
  for (let dayIdx = 0; dayIdx < allDays.length; dayIdx++) {
    const day = allDays[dayIdx];
    const shiftIdx = day.shifts.findIndex(s => s.shiftTemplateId === shiftTemplateId);
    if (shiftIdx === -1) continue;

    const shift = day.shifts[shiftIdx];

    const updatedShift: DomainShift = {
      ...shift,
      assignedStaffIds: [...shift.assignedStaffIds, staffId],
    };
    const updatedShifts = [
      ...day.shifts.slice(0, shiftIdx),
      updatedShift,
      ...day.shifts.slice(shiftIdx + 1),
    ];
    const updatedDay: DomainDay = { ...day, shifts: updatedShifts };
    const updatedDays: DomainDay[] = [
      ...allDays.slice(0, dayIdx),
      updatedDay,
      ...allDays.slice(dayIdx + 1),
    ];

    return { success: true, updatedDays };
  }

  return { success: false, reason: 'SHIFT_NOT_FOUND' };
}
