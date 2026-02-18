import React from 'react';
import { Staff } from '@/types/staff';


type StaffPoolProps = {
  staff: Staff[];
  weeklyHours: Map<string, number>;
  maxWeeklyHours?: number;
};

export function StaffPool({ staff, weeklyHours, maxWeeklyHours = 40 }: StaffPoolProps) {
  if (!staff.length) return <div>No staff found.</div>;
  // Sort staff by lowest weekly hours (using _id for map lookup)
  const sortedStaff = [...staff].sort((a, b) =>
    (weeklyHours.get(a._id) ?? 0) - (weeklyHours.get(b._id) ?? 0)
  );
  return (
    <div>
      {sortedStaff.map(s => {
        const hours = weeklyHours.get(s._id) ?? 0;
        let warning = '';
        if (hours >= maxWeeklyHours) {
          warning = ' (Over limit)';
        } else if (hours >= 0.9 * maxWeeklyHours) {
          warning = ' (Near limit)';
        }
        return (
          <div key={s._id}>
            {s.name} ({hours}h){warning}
          </div>
        );
      })}
    </div>
  );
}
