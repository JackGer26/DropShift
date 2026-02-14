// Suggest staff for a shift based on role, availability, and weekly hours
import { Staff } from '../types/staff';
import { RotaDay, RotaShift } from '../types/rota';
import { calculateWeeklyHours } from './calculateWeeklyHours';
import { isOverlapping } from './isOverlapping';

export function getSuggestedStaff(
  shift: RotaShift,
  dayOfWeek: number,
  rotaDays: RotaDay[],
  staffList: Staff[]
): Staff[] {
  // 1. Filter by roleRequired
  let candidates = staffList.filter(s => s.role === shift.roleRequired);

  // 2. Exclude already assigned to this shift
  candidates = candidates.filter(s => !(shift.assignedStaffIds || []).includes(s._id));

  // 3. Exclude staff assigned to overlapping shifts on the same day
  const day = rotaDays.find(d => d.dayOfWeek === dayOfWeek);
  candidates = candidates.filter(staff => {
    if (!day) return true;
    for (const otherShift of day.shifts || []) {
      if (otherShift === shift) continue;
      if (!(otherShift.assignedStaffIds || []).includes(staff._id)) continue;
      if (!otherShift.startTime || !otherShift.endTime || !shift.startTime || !shift.endTime) continue;
      if (isOverlapping(otherShift.startTime, otherShift.endTime, shift.startTime, shift.endTime)) {
        return false;
      }
    }
    return true;
  });

  // 4. Calculate weekly hours
  const hoursMap = calculateWeeklyHours(rotaDays);

  // 5. Sort by lowest weekly hours
  candidates.sort((a, b) => {
    const ha = hoursMap.get(a._id) || 0;
    const hb = hoursMap.get(b._id) || 0;
    return ha - hb;
  });

  return candidates;
}
