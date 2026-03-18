const TZ = 'America/Sao_Paulo';

/**
 * Returns today's date in São Paulo timezone as YYYY-MM-DD.
 */
export function todaySP(): string {
  return dateInSP(new Date());
}

/**
 * Returns yesterday's date in São Paulo timezone as YYYY-MM-DD.
 */
export function yesterdaySP(): string {
  const now = new Date();
  // Get today in SP, then subtract one day
  const todayStr = dateInSP(now);
  const [y, m, d] = todayStr.split('-').map(Number);
  const yesterday = new Date(y, m - 1, d - 1);
  return formatISO(yesterday);
}

/**
 * Converts GA4 date format (YYYYMMDD) to YYYY-MM-DD.
 */
export function formatGA4Date(yyyymmdd: string): string {
  if (yyyymmdd.length !== 8) return yyyymmdd;
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

/**
 * Returns the equivalent previous period for comparison.
 * Same duration, immediately before the given period.
 *
 * Example: if startDate=2026-03-11, endDate=2026-03-17 (7 days),
 * returns startDate=2026-03-04, endDate=2026-03-10
 */
export function getPreviousPeriod(
  startDate: string,
  endDate: string
): { startDate: string; endDate: string } {
  const start = parseDate(startDate);
  const end = parseDate(endDate);

  // Duration in milliseconds
  const durationMs = end.getTime() - start.getTime();
  // Number of days in the period (inclusive)
  const days = Math.round(durationMs / (1000 * 60 * 60 * 24)) + 1;

  // Previous period ends the day before the current period starts
  const prevEnd = new Date(start.getTime() - 1000 * 60 * 60 * 24);
  // Previous period starts `days` days before prevEnd (inclusive)
  const prevStart = new Date(prevEnd.getTime() - (days - 1) * 1000 * 60 * 60 * 24);

  return {
    startDate: formatISO(prevStart),
    endDate: formatISO(prevEnd),
  };
}

// ── Internal helpers ──

/**
 * Converts a Date object to YYYY-MM-DD in São Paulo timezone
 * using Intl.DateTimeFormat (available in Workers runtime).
 */
function dateInSP(date: Date): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  // en-CA locale formats as YYYY-MM-DD
  return formatter.format(date);
}

/**
 * Parses a YYYY-MM-DD string into a Date at midnight UTC.
 */
function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/**
 * Formats a Date as YYYY-MM-DD using UTC values.
 */
function formatISO(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
