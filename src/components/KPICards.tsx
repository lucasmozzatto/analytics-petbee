import type { KPIs } from '../types';
import { formatNumber, formatPercent, formatDuration } from '../lib/format';
import DeltaBadge from './DeltaBadge';

interface KPICardsProps {
  data: KPIs;
  previous?: KPIs;
}

interface CardConfig {
  label: string;
  key: keyof KPIs;
  format: (v: number) => string;
  color: string;
  invert?: boolean;
}

const CARDS: CardConfig[] = [
  { label: 'SESSÕES', key: 'sessions', format: formatNumber, color: 'var(--accent)' },
  { label: 'USUÁRIOS', key: 'users', format: formatNumber, color: 'var(--teal)' },
  { label: 'BOUNCE RATE', key: 'bounceRate', format: (v) => formatPercent(v), color: 'var(--red)', invert: true },
  { label: 'DURAÇÃO MÉDIA', key: 'avgSessionDuration', format: formatDuration, color: 'var(--blue)' },
  { label: 'LEADS', key: 'leads', format: formatNumber, color: 'var(--accent)' },
];

export default function KPICards({ data, previous }: KPICardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {CARDS.map((card, i) => (
        <div
          key={card.key}
          className="rounded-xl p-4 fade-up"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            animationDelay: `${i * 0.04}s`,
          }}
        >
          <div
            className="text-xs font-medium tracking-wider mb-2"
            style={{ color: 'var(--text-muted)', letterSpacing: '0.05em' }}
          >
            {card.label}
          </div>
          <div className="flex items-end gap-2">
            <span
              className="text-2xl font-bold"
              style={{ fontFamily: 'var(--mono)', color: card.color }}
            >
              {card.format(data[card.key])}
            </span>
            {previous && (
              <DeltaBadge
                current={data[card.key]}
                previous={previous[card.key]}
                invert={card.invert}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
