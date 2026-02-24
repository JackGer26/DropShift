import { DomainStaff, DomainShift, DomainDay } from './types';
import { calculateWeeklyHours } from './calculateWeeklyHours';
import { isOverlapping } from './isOverlapping';

/**
 * Suggest eligible staff for a shift.
 *
 * Filters by role, excludes already-assigned and overlapping staff,
 * then sorts by lowest weekly hours (most available first).
 *
 * Pure function — no side effects, no mutation.
 */
export function getSuggestedStaff(
  shift: DomainShift,
  dayOfWeek: number,
  days: DomainDay[],
  staffList: DomainStaff[],
): DomainStaff[] {
  // 1. Role match only
  let candidates = staffList.filter(s => s.role === shift.roleRequired);

  // 2. Exclude staff already assigned to this shift
  candidates = candidates.filter(s => !(shift.assignedStaffIds || []).includes(s.id));

  // 3. Exclude staff assigned to an overlapping shift on the same day
  const day = days.find(d => d.dayOfWeek === dayOfWeek);
  candidates = candidates.filter(staff => {
    if (!day) return true;
    for (const otherShift of day.shifts || []) {
      if (otherShift.shiftTemplateId === shift.shiftTemplateId) continue;
      if (!(otherShift.assignedStaffIds || []).includes(staff.id)) continue;
      if (!otherShift.startTime || !otherShift.endTime || !shift.startTime || !shift.endTime) continue;
      if (isOverlapping(otherShift.startTime, otherShift.endTime, shift.startTime, shift.endTime)) {
        return false;
      }
    }
    return true;
  });

  // 4. Sort: within-contracted staff first (by lowest hours), over-contracted last
  const hoursMap = calculateWeeklyHours(days);
  candidates.sort((a, b) => {
    const aHours = hoursMap.get(a.id) ?? 0;
    const bHours = hoursMap.get(b.id) ?? 0;
    const aOver = a.contractedHours !== undefined && aHours > a.contractedHours;
    const bOver = b.contractedHours !== undefined && bHours > b.contractedHours;
    if (aOver !== bOver) return aOver ? 1 : -1;
    return aHours - bHours;
  });

  return candidates;
}
