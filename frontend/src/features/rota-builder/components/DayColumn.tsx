import React from 'react';
import { RotaDay } from '@/types/rota';
import { Staff } from '@/types/staff';
import ShiftSlot from './ShiftSlot';

// dayOfWeek: 0 = Sunday … 6 = Saturday (matches rota.ts)
const DAY_NAMES: Record<number, string> = {
  0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat',
};

interface DayColumnProps {
  day: RotaDay;
  staff: Staff[];
  onSelectShift: (shiftTemplateId: string, dayOfWeek: number) => void;
}

export function DayColumn({ day, staff, onSelectShift }: DayColumnProps) {
  const dayName = DAY_NAMES[day.dayOfWeek] ?? `Day ${day.dayOfWeek}`;

  return (
    <div className="flex flex-col min-w-0">
      {/* Day header */}
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-center pb-2 mb-2 border-b border-gray-200">
        {dayName}
      </div>

      {/* Shifts */}
      <div className="space-y-2">
        {Array.isArray(day.shifts) && day.shifts.length > 0 ? (
          day.shifts.map(shift => (
            <ShiftSlot
              key={shift.id}
              shift={shift}
              staff={staff}
              dayOfWeek={day.dayOfWeek}
              onSelectShift={onSelectShift}
            />
          ))
        ) : (
          <p className="text-xs text-gray-400 text-center py-4">No shifts</p>
        )}
      </div>
    </div>
  );
}
