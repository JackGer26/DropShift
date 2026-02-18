/**
 * DayCard - Displays all shifts for a single day
 * Pure presentational component
 */

import React from 'react';
import { DayCardProps } from '@/types/staffRota';
import { ShiftCard } from './ShiftCard';

export const DayCard: React.FC<DayCardProps> = ({ day }) => {
  return (
    <div className="day-card" style={styles.container}>
      <div style={styles.header}>
        <h4 style={styles.dayName}>{day.dayName}</h4>
        <span style={styles.totalHours}>
          {day.totalHours}h total
        </span>
      </div>

      <div style={styles.shiftList}>
        {day.shifts.length === 0 ? (
          <p style={styles.noShifts}>No shifts</p>
        ) : (
          day.shifts.map((shift, index) => (
            <ShiftCard key={index} shift={shift} />
          ))
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    marginBottom: '16px',
  } as React.CSSProperties,
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '2px solid #e0e0e0',
  } as React.CSSProperties,
  dayName: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
    color: '#333',
  } as React.CSSProperties,
  totalHours: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#666',
  } as React.CSSProperties,
  shiftList: {
    paddingLeft: '8px',
  } as React.CSSProperties,
  noShifts: {
    fontSize: '14px',
    color: '#999',
    fontStyle: 'italic',
    margin: 0,
  } as React.CSSProperties,
};
