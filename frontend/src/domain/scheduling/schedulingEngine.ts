import { RotaDay, RotaShift } from '../../types/rota';
import { Staff } from '../../types/staff';
import { isOverlapping } from './isOverlapping';
import { calculateShiftDuration } from './timeUtils';
import { calculateWeeklyHours } from './calculateWeeklyHours';
import { MAX_WEEKLY_HOURS, NEAR_LIMIT_THRESHOLD } from './constants';
import {
  AssignmentWarning,
  AssignmentValidation,
  AssignmentResult,
} from './types';

/**
 * Pure validation: can this staff member be assigned to this shift?
 *
 * Checks (in order):
 * 1. Role match
 * 2. Slot capacity
 * 3. Already assigned
 * 4. Overlapping shift on the same day
 * 5. Weekly hours warnings (non-blocking)
 */
export function canAssignStaffToShift(
  staff: Staff,
  shift: RotaShift,
  day: RotaDay,
  rotaDays: RotaDay[],
): AssignmentValidation {
  const warnings: AssignmentWarning[] = [];

  // 1. Role mismatch
  if (staff.role !== shift.roleRequired) {
    return { valid: false, rejection: 'ROLE_MISMATCH', warnings };
  }

  // 2. Slot full
  if (shift.assignedStaffIds.length >= shift.quantityRequired) {
    return { valid: false, rejection: 'SLOT_FULL', warnings };
  }

  // 3. Already assigned to this shift
  if (shift.assignedStaffIds.includes(staff._id)) {
    return { valid: false, rejection: 'ALREADY_ASSIGNED', warnings };
  }

  // 4. Overlapping shift on the same day
  const hasOverlap = day.shifts.some(s => {
    if (s === shift) return false;
    if (!s.assignedStaffIds.includes(staff._id)) return false;
    if (!s.startTime || !s.endTime || !shift.startTime || !shift.endTime) return false;
    return isOverlapping(s.startTime, s.endTime, shift.startTime, shift.endTime);
  });
  if (hasOverlap) {
    return { valid: false, rejection: 'OVERLAPPING_SHIFT', warnings };
  }

  // 5. Weekly hours warnings (non-blocking)
  if (shift.startTime && shift.endTime) {
    const duration = calculateShiftDuration(shift.startTime, shift.endTime);
    const currentHours = calculateWeeklyHours(rotaDays).get(staff._id) ?? 0;
    const projectedHours = currentHours + duration;

    if (projectedHours > MAX_WEEKLY_HOURS) {
      warnings.push('EXCEEDS_WEEKLY_HOURS');
    } else if (projectedHours >= MAX_WEEKLY_HOURS * NEAR_LIMIT_THRESHOLD) {
      warnings.push('NEAR_WEEKLY_LIMIT');
    }
  }

  return { valid: true, warnings };
}

/**
 * Pure state transition: validate and apply a staff assignment.
 *
 * Locates the target shift by shiftTemplateId, validates the assignment,
 * and returns either the immutably updated rotaDays or a rejection.
 */
export function applyAssignment(
  staff: Staff,
  shiftTemplateId: string,
  rotaDays: RotaDay[],
): AssignmentResult {
  for (let dayIdx = 0; dayIdx < rotaDays.length; dayIdx++) {
    const day = rotaDays[dayIdx];
    const shiftIdx = day.shifts.findIndex(s => s.shiftTemplateId === shiftTemplateId);
    if (shiftIdx === -1) continue;

    const shift = day.shifts[shiftIdx];
    const validation = canAssignStaffToShift(staff, shift, day, rotaDays);

    if (!validation.valid) {
      return { success: false, reason: validation.rejection!, warnings: validation.warnings };
    }

    // Immutable update: append staffId to the shift's assignedStaffIds
    const updatedShift: RotaShift = {
      ...shift,
      assignedStaffIds: [...shift.assignedStaffIds, staff._id],
    };
    const updatedShifts = [
      ...day.shifts.slice(0, shiftIdx),
      updatedShift,
      ...day.shifts.slice(shiftIdx + 1),
    ];
    const updatedDay: RotaDay = { ...day, shifts: updatedShifts };
    const updatedDays = [
      ...rotaDays.slice(0, dayIdx),
      updatedDay,
      ...rotaDays.slice(dayIdx + 1),
    ];

    return { success: true, updatedDays, warnings: validation.warnings };
  }

  // Shift not found (should not happen in normal flow)
  return { success: false, reason: 'SLOT_FULL', warnings: [] };
}
