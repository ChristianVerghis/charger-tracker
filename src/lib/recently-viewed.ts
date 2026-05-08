// localStorage-backed "recently viewed" list. Used in the empty state of the
// detail panel so a returning user sees the last few stations they checked.
// Capped small + tolerant of stale IDs; the consumer filters against the
// snapshot before rendering, so a station that's been removed from OCM since
// the user last looked at it just disappears quietly.

const KEY = 'charger-tracker:recent-stations';
const MAX = 5;

export function readRecent(): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((n): n is number => typeof n === 'number');
  } catch {
    return [];
  }
}

export function pushRecent(id: number): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const current = readRecent().filter((x) => x !== id);
    const next = [id, ...current].slice(0, MAX);
    window.localStorage.setItem(KEY, JSON.stringify(next));
    return next;
  } catch {
    return [];
  }
}
