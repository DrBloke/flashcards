export const UNIT_MAP: Record<string, number> = {
  s: 1,
  sec: 1,
  second: 1,
  seconds: 1,
  m: 60,
  min: 60,
  mine: 60,
  minute: 60,
  minutes: 60,
  h: 3600,
  hr: 3600,
  hour: 3600,
  hours: 3600,
  d: 86400,
  day: 86400,
  days: 86400,
  w: 604800,
  week: 604800,
  weeks: 604800,
  M: 2592000,
  month: 2592000,
  months: 2592000,
  y: 31536000,
  year: 31536000,
  years: 31536000,
};

/**
 * Parses a duration string into seconds.
 * Supports units: s, m, h, d, w, M, y
 * Examples: "1d", "1h 30m", "10s", "1.5d"
 */
export function parseDuration(str: string): number | null {
  if (!str) return null;
  const trimmed = str.trim();
  if (!trimmed) return null;

  // If it's just a number, treat as seconds
  if (/^\d+(?:\.\d+)?$/.test(trimmed)) {
    return parseFloat(trimmed);
  }

  // Regex to find value and optional unit
  const regex = /(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?/g;

  let totalSeconds = 0;
  let match;
  let hasMatch = false;

  while ((match = regex.exec(trimmed)) !== null) {
    if (match[0].length === 0) {
      regex.lastIndex++;
      continue;
    }

    const val = parseFloat(match[1]);
    const unitStr = match[2]?.toLowerCase();

    if (unitStr && UNIT_MAP[unitStr]) {
      totalSeconds += val * UNIT_MAP[unitStr];
      hasMatch = true;
    } else if (!unitStr) {
      // No unit, default to seconds? Or if it's mixed with others?
      totalSeconds += val;
      hasMatch = true;
    }
  }

  return hasMatch ? totalSeconds : null;
}

/**
 * Formats seconds into a readable duration string.
 * Examples: "1d", "1h 30m", "10s"
 */
export function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds === undefined || isNaN(seconds)) return "";
  if (seconds === 0) return "0s";

  const units = [
    { label: "y", value: 31536000 },
    { label: "d", value: 86400 },
    { label: "h", value: 3600 },
    { label: "m", value: 60 },
    { label: "s", value: 1 },
  ];

  let remaining = seconds;
  const parts: string[] = [];

  for (const unit of units) {
    if (remaining >= unit.value) {
      const count = Math.floor(remaining / unit.value);
      if (count > 0) {
        remaining -= count * unit.value;
        parts.push(`${count}${unit.label}`);
      }
    }
  }

  if (parts.length === 0 && seconds > 0) {
    return `${seconds}s`; // for < 1s
  }

  return parts.slice(0, 2).join(" ");
}
