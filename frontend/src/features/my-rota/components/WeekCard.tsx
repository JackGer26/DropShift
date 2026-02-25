/**
 * WeekCard - Displays a week's worth of shifts
 * Groups days and shows summary
 */

import React from 'react';
import { WeekCardProps } from '@/types/staffRota';
import { DayCard } from './DayCard';
import { formatWeekDate } from '@/utils/rotaUtils';

export const WeekCard: React.FC<WeekCardProps> = ({ week }) => {
  const past = week.isPast;
  return (
    <div className={`rounded-xl border p-4 sm:p-5 mb-4 shadow-sm ${past ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-200'}`}>
      {/* Week Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-4 mb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className={`text-lg font-semibold ${past ? 'text-gray-500' : 'text-gray-900'}`}>
              Week of {formatWeekDate(week.weekStartDate)}
            </h3>
            {past && (
              <span className="text-xs font-medium text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
                Past
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            Location: {week.locationName ?? week.locationId}
          </p>
        </div>
        <div className="flex gap-6 sm:text-right shrink-0">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Hours</p>
            <p className={`text-lg font-semibold ${past ? 'text-gray-400' : 'text-gray-900'}`}>{week.totalHours}h</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Shifts</p>
            <p className={`text-lg font-semibold ${past ? 'text-gray-400' : 'text-gray-900'}`}>{week.totalShifts}</p>
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
