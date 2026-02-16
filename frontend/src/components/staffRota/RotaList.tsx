/**
 * RotaList - Displays list of week cards
 * Pure presentational component
 */

import React from 'react';
import { RotaListProps } from '../../types/staffRota';
import { WeekCard } from './WeekCard';

export const RotaList: React.FC<RotaListProps> = ({ weeks }) => {
  return (
    <div className="rota-list">
      {weeks.map((week, index) => (
        <WeekCard key={week.weekStartDate || index} week={week} />
      ))}
    </div>
  );
};
