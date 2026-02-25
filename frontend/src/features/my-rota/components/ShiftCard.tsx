/**
 * ShiftCard - Displays a single shift
 * Pure presentational component - no business logic
 */

import React from 'react';
import { ShiftCardProps } from '@/types/staffRota';
import { formatTime } from '@/utils/rotaUtils';

export const ShiftCard: React.FC<ShiftCardProps> = ({ shift }) => {
  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-white">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-800">
          {shift.startTime && formatTime(shift.startTime)}
          {' – '}
          {shift.endTime && formatTime(shift.endTime)}
        </span>
        <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
          {shift.durationHours}h
        </span>
      </div>

      {shift.roleRequired && (
        <span className="inline-block text-xs text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded mt-1">
          {shift.roleRequired}
        </span>
      )}
    </div>
  );
};
