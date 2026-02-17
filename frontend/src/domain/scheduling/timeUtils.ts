/**
 * Convert "HH:MM" to minutes since midnight.
 * Consolidated from the duplicated definitions in isOverlapping.ts and calculateWeeklyHours.ts.
 */
export function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Calculate duration in hours between two "HH:MM" times.
 * Handles shifts that cross midnight.
 */
export function calculateShiftDuration(startTime: string, endTime: string): number {
  const startMins = toMinutes(startTime);
  let endMins = toMinutes(endTime);

  if (endMins < startMins) {
    endMins += 24 * 60;
  }

  return (endMins - startMins) / 60;
}
