/**
 * Format a number with pt-BR locale (dot thousands separator, comma decimal).
 */
export function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR');
}

/**
 * Format a number as percentage with pt-BR locale.
 * Example: 52.3456 → "52,35%"
 */
export function formatPercent(value: number, decimals = 2): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }) + '%';
}

/**
 * Format seconds into "Xm YYs" duration string.
 * Example: 127.5 → "2m 07s"
 */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

/**
 * Format ISO date string (YYYY-MM-DD) to Brazilian format (DD/MM/YYYY).
 * Example: "2026-03-15" → "15/03/2026"
 */
export function formatDateBR(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

/**
 * Format a number in compact notation (k, M) with pt-BR decimal comma.
 * Example: 12345 → "12,3k", 1500000 → "1,5M"
 */
export function formatCompact(value: number): string {
  if (value >= 1000000) return (value / 1000000).toFixed(1).replace('.', ',') + 'M';
  if (value >= 1000) return (value / 1000).toFixed(1).replace('.', ',') + 'k';
  return value.toLocaleString('pt-BR');
}
