// Utility functions for week calculations
// Week starts on Monday

/**
 * Returns the ISO date string (YYYY-MM-DD) for the Monday of the week containing the given date.
 * @param date Date object
 * @returns ISO string for start of week (Monday)
 */
export function getStartOfWeek(date: Date): string {
  // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  const day = date.getDay();
  // Calculate how many days to subtract to get to Monday
  const diff = (day === 0 ? -6 : 1 - day);
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  // Format as YYYY-MM-DD
  return monday.toISOString().slice(0, 10);
}

/**
 * Returns the ISO date string (YYYY-MM-DD) for the Monday of the next week.
 * @param weekStart ISO string (YYYY-MM-DD) for current week start (Monday)
 * @returns ISO string for next week's Monday
 */
export function getNextWeek(weekStart: string): string {
  const date = new Date(weekStart);
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
}

/**
 * Returns the ISO date string (YYYY-MM-DD) for the Monday of the previous week.
 * @param weekStart ISO string (YYYY-MM-DD) for current week start (Monday)
 * @returns ISO string for previous week's Monday
 */
export function getPreviousWeek(weekStart: string): string {
  const date = new Date(weekStart);
  date.setDate(date.getDate() - 7);
  return date.toISOString().slice(0, 10);
}
