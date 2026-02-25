/**
 * DayCard - Displays all shifts for a single day
 * Pure presentational component
 */

import React from 'react';
import { DayCardProps } from '@/types/staffRota';
import { ShiftCard } from './ShiftCard';

export const DayCard: React.FC<DayCardProps> = ({ day }) => {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-100">
        <h4 className="text-sm font-semibold text-gray-700">{day.dayName}</h4>
        <span className="text-xs text-gray-500">{day.totalHours}h total</span>
      </div>

      <div className="space-y-2">
        {day.shifts.length === 0 ? (
          <p className="text-xs text-gray-400 italic">No shifts</p>
        ) : (
          day.shifts.map((shift, index) => (
            <ShiftCard key={index} shift={shift} />
          ))
        )}
      </div>
    </div>
  );
};
