// Utility to check if two time intervals overlap (HH:mm format)
// Returns true if [startA, endA] overlaps with [startB, endB]

export function isOverlapping(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  // Helper to convert HH:mm to minutes since midnight
  function toMinutes(time: string): number {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  }
  const aStart = toMinutes(startA);
  const aEnd = toMinutes(endA);
  const bStart = toMinutes(startB);
  const bEnd = toMinutes(endB);

  // Overlap if one starts before the other ends and ends after the other starts
  return aStart < bEnd && bStart < aEnd;
}
