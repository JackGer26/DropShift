/**
 * WeekCard - Displays a week's worth of shifts
 * Groups days and shows summary
 */

import React from 'react';
import { WeekCardProps } from '../../types/staffRota';
import { DayCard } from './DayCard';
import { formatWeekDate } from '../../utils/rotaUtils';

export const WeekCard: React.FC<WeekCardProps> = ({ week }) => {
  return (
    <div className="week-card" style={styles.container}>
      {/* Week Header */}
      <div style={styles.header}>
        <div>
          <h3 style={styles.weekDate}>
            Week of {formatWeekDate(week.weekStartDate)}
          </h3>
          <p style={styles.locationId}>Location: {week.locationId}</p>
        </div>
        <div style={styles.summary}>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Total Hours</span>
            <span style={styles.summaryValue}>{week.totalHours}h</span>
          </div>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Shifts</span>
            <span style={styles.summaryValue}>{week.totalShifts}</span>
          </div>
        </div>
      </div>

      {/* Day List */}
      <div style={styles.dayList}>
        {week.days.map(day => (
          <DayCard key={day.dayOfWeek} day={day} />
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    border: '1px solid #ddd',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '24px',
    backgroundColor: '#fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  } as React.CSSProperties,
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '2px solid #f0f0f0',
  } as React.CSSProperties,
  weekDate: {
    margin: '0 0 4px 0',
    fontSize: '20px',
    fontWeight: 600,
    color: '#222',
  } as React.CSSProperties,
  locationId: {
    margin: 0,
    fontSize: '14px',
    color: '#666',
  } as React.CSSProperties,
  summary: {
    display: 'flex',
    gap: '16px',
  } as React.CSSProperties,
  summaryItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  } as React.CSSProperties,
  summaryLabel: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '4px',
  } as React.CSSProperties,
  summaryValue: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#2196F3',
  } as React.CSSProperties,
  dayList: {
    marginTop: '16px',
  } as React.CSSProperties,
};
