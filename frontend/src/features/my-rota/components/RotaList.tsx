/**
 * RotaList - Displays list of week cards
 * Pure presentational component
 */

import React from 'react';
import { RotaListProps } from '@/types/staffRota';
import { WeekCard } from './WeekCard';

export const RotaList: React.FC<RotaListProps> = ({ weeks }) => {
  const activeWeeks = weeks.filter(w => !w.isPast);
  const pastWeeks = weeks.filter(w => w.isPast).slice(0, 4);

  return (
    <div>
      {activeWeeks.map((week, index) => (
        <WeekCard key={week.weekStartDate || index} week={week} />
      ))}

      {pastWeeks.length > 0 && (
        <>
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 border-t border-gray-200" />
            <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">Past Shifts</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>
          {pastWeeks.map((week, index) => (
            <WeekCard key={week.weekStartDate || index} week={week} />
          ))}
        </>
      )}
    </div>
  );
};
