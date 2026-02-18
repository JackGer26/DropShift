import { DomainDay } from './types';
import { toMinutes } from './timeUtils';

/**
 * Calculate total weekly hours per staff member from a set of days.
 * Returns a Map<staffId, hours> rounded to 2 decimal places.
 *
 * Pure function — no side effects, no mutation.
 */
export function calculateWeeklyHours(days: DomainDay[]): Map<string, number> {
  const staffHours = new Map<string, number>();

  for (const day of days) {
    for (const shift of day.shifts || []) {
      if (!shift.startTime || !shift.endTime) continue;
      const durationMins = toMinutes(shift.endTime) - toMinutes(shift.startTime);
      if (durationMins <= 0) continue;
      const durationHours = durationMins / 60;
      for (const staffId of shift.assignedStaffIds || []) {
        staffHours.set(staffId, (staffHours.get(staffId) || 0) + durationHours);
      }
    }
  }

  for (const [staffId, hours] of staffHours.entries()) {
    staffHours.set(staffId, Math.round(hours * 100) / 100);
  }

  return staffHours;
}
