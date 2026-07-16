export interface TimeSlot {
  day: number; // 1: Mon, ..., 5: Fri
  start: string; // "09:00"
  end: string; // "10:30"
}

/**
 * Checks if two schedule slots overlap on the same day.
 */
export function slotsOverlap(s1: TimeSlot, s2: TimeSlot): boolean {
  if (s1.day !== s2.day) return false;

  const [h1s, m1s] = s1.start.split(":").map(Number);
  const [h1e, m1e] = s1.end.split(":").map(Number);
  const [h2s, m2s] = s2.start.split(":").map(Number);
  const [h2e, m2e] = s2.end.split(":").map(Number);

  const t1start = h1s * 60 + m1s;
  const t1end = h1e * 60 + m1e;
  const t2start = h2s * 60 + m2s;
  const t2end = h2e * 60 + m2e;

  // Overlap condition: start of one is before end of other, and start of other is before end of one
  return t1start < t2end && t2start < t1end;
}
