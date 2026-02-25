/**
 * WeekCard - Displays a week's worth of shifts
 * Groups days and shows summary
 */

import React from 'react';
import { WeekCardProps } from '@/types/staffRota';
import { DayCard } from './DayCard';
import { formatWeekDate } from '@/utils/rotaUtils';

export const WeekCard: React.FC<WeekCardProps> = ({ week }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 mb-4 shadow-sm">
      {/* Week Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-4 mb-4 border-b border-gray-100">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Week of {formatWeekDate(week.weekStartDate)}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Location: {week.locationName ?? week.locationId}
          </p>
        </div>
        <div className="flex gap-6 sm:text-right shrink-0">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Hours</p>
            <p className="text-lg font-semibold text-gray-900">{week.totalHours}h</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Shifts</p>
            <p className="text-lg font-semibold text-gray-900">{week.totalShifts}</p>
          </div>
        </div>
      </div>

      {/* Day List */}
      <div>
        {week.days.map(day => (
          <DayCard key={day.dayOfWeek} day={day} />
        ))}
      </div>
    </div>
  );
};
