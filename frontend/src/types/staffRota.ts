/**
 * Type definitions for staff-facing rota display
 * Extends base types with display-specific properties
 */

import { StaffRotaItem, StaffShift } from '../services/rota.service';

/**
 * Enriched shift with template details for display
 */
export interface EnrichedShift extends StaffShift {
  // From shift template (would be joined in real app)
  startTime?: string;
  endTime?: string;
  roleRequired?: string;
  durationHours?: number;
}

/**
 * Shifts grouped by day of week
 */
export interface DayGroup {
  dayOfWeek: number;
  dayName: string;
  shifts: EnrichedShift[];
  totalHours: number;
}

/**
 * Week with enriched data for display
 */
export interface WeekGroup {
  weekStartDate: string;
  locationId: string;
  days: DayGroup[];
  totalHours: number;
  totalShifts: number;
}

/**
 * Props for presentational components
 */
export interface RotaListProps {
  weeks: WeekGroup[];
}

export interface WeekCardProps {
  week: WeekGroup;
}

export interface DayCardProps {
  day: DayGroup;
}

export interface ShiftCardProps {
  shift: EnrichedShift;
}

/**
 * State management types
 */
export interface DateRangeFilter {
  from?: string;
  to?: string;
}
