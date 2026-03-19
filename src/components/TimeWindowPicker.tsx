import { formatDateBR } from '../lib/format';

interface TimeWindowOption {
  label: string;
  value: string;
}

const OPTIONS: TimeWindowOption[] = [
  { label: 'Hoje', value: 'today' },
  { label: 'Ontem', value: 'yesterday' },
  { label: '7 dias', value: '7d' },
  { label: '14 dias', value: '14d' },
  { label: '30 dias', value: '30d' },
  { label: 'Este mês', value: 'this_month' },
  { label: 'Mês passado', value: 'last_month' },
];

interface TimeWindowPickerProps {
  value: string;
  onChange: (value: string) => void;
  startDate?: string;
  endDate?: string;
}

export default function TimeWindowPicker({ value, onChange, startDate, endDate }: TimeWindowPickerProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex gap-1 flex-wrap">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
            style={{
              fontFamily: 'var(--mono)',
              fontSize: '12px',
              backgroundColor: value === opt.value ? 'var(--surface-alt)' : 'transparent',
              border: value === opt.value ? '1px solid var(--border-light)' : '1px solid transparent',
              color: value === opt.value ? 'var(--text)' : 'var(--text-muted)',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {startDate && endDate && (
        <span
          className="text-xs"
          style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)' }}
        >
          {formatDateBR(startDate)} — {formatDateBR(endDate)}
        </span>
      )}
    </div>
  );
}
