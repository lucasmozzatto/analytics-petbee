import { useState } from 'react';
import { formatDateBR } from '../lib/format';
import { TIME_WINDOWS } from '../hooks/useGA4Data';

const OPTIONS = [
  ...TIME_WINDOWS,
  { label: 'Personalizado', value: 'custom' },
];

interface TimeWindowPickerProps {
  value: string;
  onChange: (value: string) => void;
  startDate?: string;
  endDate?: string;
  customStart?: string;
  customEnd?: string;
  onCustomRange?: (start: string, end: string) => void;
}

export default function TimeWindowPicker({
  value,
  onChange,
  startDate,
  endDate,
  customStart,
  customEnd,
  onCustomRange,
}: TimeWindowPickerProps) {
  const [localStart, setLocalStart] = useState(customStart || '');
  const [localEnd, setLocalEnd] = useState(customEnd || '');

  const handleCustomClick = () => {
    if (value === 'custom') return;
    // Pre-fill with current range when switching to custom
    setLocalStart(startDate || '');
    setLocalEnd(endDate || '');
    onChange('custom');
  };

  const handleApply = () => {
    if (localStart && localEnd && onCustomRange) {
      onCustomRange(localStart, localEnd);
    }
  };

  const inputStyle = {
    backgroundColor: 'var(--surface-alt)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    fontFamily: 'var(--mono)',
    fontSize: '12px',
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 flex-wrap">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => opt.value === 'custom' ? handleCustomClick() : onChange(opt.value)}
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
        {startDate && endDate && value !== 'custom' && (
          <span
            className="text-xs"
            style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)' }}
          >
            {formatDateBR(startDate)} — {formatDateBR(endDate)}
          </span>
        )}
      </div>

      {/* Custom date range inputs */}
      {value === 'custom' && (
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            value={localStart}
            onChange={(e) => setLocalStart(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs"
            style={inputStyle}
          />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>até</span>
          <input
            type="date"
            value={localEnd}
            onChange={(e) => setLocalEnd(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs"
            style={inputStyle}
          />
          <button
            onClick={handleApply}
            disabled={!localStart || !localEnd}
            className="px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
            style={{
              fontFamily: 'var(--mono)',
              fontSize: '12px',
              backgroundColor: localStart && localEnd ? 'var(--accent-dim)' : 'transparent',
              border: '1px solid var(--accent)',
              color: 'var(--accent)',
              opacity: localStart && localEnd ? 1 : 0.4,
            }}
          >
            Aplicar
          </button>
          {startDate && endDate && (
            <span
              className="text-xs"
              style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)' }}
            >
              {formatDateBR(startDate)} — {formatDateBR(endDate)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
