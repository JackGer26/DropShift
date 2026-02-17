import { toMinutes } from './timeUtils';

/**
 * Check if two time intervals overlap (HH:MM format).
 * Returns true if [startA, endA] overlaps with [startB, endB].
 */
export function isOverlapping(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const aStart = toMinutes(startA);
  const aEnd = toMinutes(endA);
  const bStart = toMinutes(startB);
  const bEnd = toMinutes(endB);

  return aStart < bEnd && bStart < aEnd;
}
