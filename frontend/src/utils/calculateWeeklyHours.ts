// Calculates total weekly hours per staff member from rotaDays
// Returns a Map<staffId, hours>
import { RotaDay } from '../types/rota';

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function calculateWeeklyHours(rotaDays: RotaDay[]): Map<string, number> {
  const staffHours = new Map<string, number>();

  for (const day of rotaDays) {
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
  // Round to 2 decimal places for display
  for (const [staffId, hours] of staffHours.entries()) {
    staffHours.set(staffId, Math.round(hours * 100) / 100);
  }
  return staffHours;
}
