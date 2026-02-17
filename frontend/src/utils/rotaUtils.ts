/**
 * Pure business logic functions for rota processing
 * These are framework-agnostic and easily testable
 */

import { StaffRotaItem, StaffShift } from '../services/rota.service';
import { EnrichedShift, DayGroup, WeekGroup } from '../types/staffRota';
import { calculateShiftDuration } from '../domain/scheduling';

/**
 * Day names for display
 */
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Get day name from day number
 */
export function getDayName(dayOfWeek: number): string {
  return DAY_NAMES[dayOfWeek] || `Day ${dayOfWeek}`;
}

/**
 * Enrich shift with calculated duration and defaults
 * Falls back to mock data if backend enrichment failed
 */
export function enrichShift(shift: StaffShift): EnrichedShift {
  // Use backend data if available, otherwise fall back to defaults
  const startTime = shift.startTime || '09:00';
  const endTime = shift.endTime || '17:00';
  const roleRequired = shift.roleRequired || 'Server';
  const durationHours = calculateShiftDuration(startTime, endTime);

  return {
    ...shift,
    startTime,
    endTime,
    roleRequired,
    durationHours
  };
}

// calculateShiftDuration has moved to domain/scheduling.
// It is imported above for use in enrichShift.
// External consumers should import from '../domain/scheduling' directly.

/**
 * Group shifts by day of week
 * @param shifts - Array of shifts
 * @returns Array of DayGroup objects sorted by day
 */
export function groupShiftsByDay(shifts: StaffShift[]): DayGroup[] {
  // Create a map to group shifts by day
  const dayMap = new Map<number, EnrichedShift[]>();

  shifts.forEach(shift => {
    const enriched = enrichShift(shift);
    const existing = dayMap.get(shift.dayOfWeek) || [];
    dayMap.set(shift.dayOfWeek, [...existing, enriched]);
  });

  // Convert map to array of DayGroup
  const dayGroups: DayGroup[] = Array.from(dayMap.entries()).map(([dayOfWeek, dayShifts]) => {
    const totalHours = dayShifts.reduce((sum, shift) => sum + (shift.durationHours || 0), 0);

    return {
      dayOfWeek,
      dayName: getDayName(dayOfWeek),
      shifts: dayShifts.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || '')),
      totalHours
    };
  });

  // Sort by day of week
  return dayGroups.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
}

/**
 * Transform API response into display-ready week groups
 * @param rotas - Array of StaffRotaItem from API
 * @returns Array of WeekGroup with enriched data
 */
export function transformRotasToWeeks(rotas: StaffRotaItem[]): WeekGroup[] {
  return rotas.map(rota => {
    const days = groupShiftsByDay(rota.shifts);
    const totalHours = days.reduce((sum, day) => sum + day.totalHours, 0);
    const totalShifts = rota.shifts.length;

    return {
      weekStartDate: rota.weekStartDate,
      locationId: rota.locationId,
      days,
      totalHours,
      totalShifts
    };
  });
}

/**
 * Calculate total hours across all weeks
 */
export function calculateTotalHours(weeks: WeekGroup[]): number {
  return weeks.reduce((sum, week) => sum + week.totalHours, 0);
}

/**
 * Calculate total number of shifts across all weeks
 */
export function calculateTotalShifts(weeks: WeekGroup[]): number {
  return weeks.reduce((sum, week) => sum + week.totalShifts, 0);
}

/**
 * Format date for display
 * @param dateString - ISO date string (YYYY-MM-DD)
 * @returns Formatted date (e.g., "Mon, 17 Feb 2026")
 */
export function formatWeekDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Format date for week display
 * @param dateString - ISO date string (YYYY-MM-DD)
 * @returns Formatted date (e.g., "16 February 2026")
 */
export function formatWeekDateLong(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Format time for display
 * @param time24 - Time in 24h format (HH:MM)
 * @returns Formatted time (e.g., "9:00 AM")
 */
export function formatTime(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Get date range for current month
 */
export function getCurrentMonthRange(): { from: string; to: string } {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    from: firstDay.toISOString().split('T')[0],
    to: lastDay.toISOString().split('T')[0]
  };
}

/**
 * Get date range for next N weeks
 */
export function getUpcomingWeeksRange(weeks: number = 4): { from: string; to: string } {
  const now = new Date();
  const future = new Date();
  future.setDate(now.getDate() + (weeks * 7));

  return {
    from: now.toISOString().split('T')[0],
    to: future.toISOString().split('T')[0]
  };
}
