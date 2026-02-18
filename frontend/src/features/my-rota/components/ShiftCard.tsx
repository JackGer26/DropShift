/**
 * ShiftCard - Displays a single shift
 * Pure presentational component - no business logic
 */

import React from 'react';
import { ShiftCardProps } from '@/types/staffRota';
import { formatTime } from '@/utils/rotaUtils';

export const ShiftCard: React.FC<ShiftCardProps> = ({ shift }) => {
  return (
    <div className="shift-card" style={styles.card}>
      <div style={styles.timeRow}>
        <span style={styles.time}>
          {shift.startTime && formatTime(shift.startTime)}
          {' - '}
          {shift.endTime && formatTime(shift.endTime)}
        </span>
        <span style={styles.duration}>
          {shift.durationHours}h
        </span>
      </div>

      {shift.roleRequired && (
        <div style={styles.role}>
          <span style={styles.roleLabel}>{shift.roleRequired}</span>
        </div>
      )}
    </div>
  );
};

// Inline styles for simplicity - use CSS modules or styled-components in production
const styles = {
  card: {
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '8px',
    backgroundColor: '#f9f9f9',
  } as React.CSSProperties,
  timeRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  } as React.CSSProperties,
  time: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#333',
  } as React.CSSProperties,
  duration: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#4CAF50',
    backgroundColor: '#e8f5e9',
    padding: '2px 8px',
    borderRadius: '4px',
  } as React.CSSProperties,
  role: {
    marginTop: '4px',
  } as React.CSSProperties,
  roleLabel: {
    fontSize: '12px',
    color: '#666',
    backgroundColor: '#e3f2fd',
    padding: '2px 8px',
    borderRadius: '4px',
  } as React.CSSProperties,
};
