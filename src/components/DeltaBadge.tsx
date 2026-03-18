interface DeltaBadgeProps {
  current: number;
  previous: number;
  invert?: boolean; // true for metrics where lower is better (bounce rate)
  format?: 'percent' | 'number';
}

export default function DeltaBadge({ current, previous, invert = false, format = 'number' }: DeltaBadgeProps) {
  if (previous === 0 && current === 0) return null;

  const delta = previous === 0 ? 100 : ((current - previous) / previous) * 100;
  const isPositive = delta > 0;
  const isGood = invert ? !isPositive : isPositive;

  const arrow = isPositive ? '↑' : '↓';
  const sign = isPositive ? '+' : '';
  const formatted = `${sign}${delta.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

  return (
    <span
      className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded"
      style={{
        fontFamily: 'var(--mono)',
        color: isGood ? 'var(--accent)' : 'var(--red)',
        backgroundColor: isGood ? 'var(--accent-dim)' : 'var(--red-dim)',
      }}
    >
      {arrow} {formatted}
    </span>
  );
}
