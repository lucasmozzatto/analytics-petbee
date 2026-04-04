import { useEffect, useState, useMemo } from 'react';
import { useTimeWindow } from '../hooks/useGA4Data';
import { getHorarios } from '../lib/api';
import { formatNumber } from '../lib/format';
import type { HeatmapCell } from '../types';
import TimeWindowPicker from '../components/TimeWindowPicker';

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

export default function Horarios() {
  const { window, setWindow, startDate, endDate, customStart, customEnd, setCustomRange } = useTimeWindow();
  const [data, setData] = useState<HeatmapCell[]>([]);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState<'sessions' | 'users'>('sessions');
  const [hovered, setHovered] = useState<HeatmapCell | null>(null);

  useEffect(() => {
    setLoading(true);
    getHorarios(startDate, endDate)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  // Build 7x24 grid from sparse data
  const { grid, maxValue } = useMemo(() => {
    const grid: Record<string, number> = {};
    let max = 0;
    for (const cell of data) {
      const key = `${cell.dayOfWeek}-${cell.hour}`;
      const val = metric === 'sessions' ? cell.sessions : cell.users;
      grid[key] = val;
      if (val > max) max = val;
    }
    return { grid, maxValue: max };
  }, [data, metric]);

  function getCellValue(day: number, hour: number): number {
    return grid[`${day}-${hour}`] ?? 0;
  }

  function getCellOpacity(value: number): number {
    if (maxValue === 0) return 0.05;
    return 0.08 + (value / maxValue) * 0.92;
  }

  function findCell(day: number, hour: number): HeatmapCell | undefined {
    return data.find((c) => c.dayOfWeek === day && c.hour === hour);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Horarios</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Heatmap de sessoes por dia da semana e hora
        </p>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <TimeWindowPicker
          value={window}
          onChange={setWindow}
          startDate={startDate}
          endDate={endDate}
          customStart={customStart}
          customEnd={customEnd}
          onCustomRange={setCustomRange}
        />
        <div className="flex gap-1">
          {(['sessions', 'users'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className="px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
              style={{
                fontFamily: 'var(--mono)',
                fontSize: '12px',
                backgroundColor: metric === m ? 'var(--surface-alt)' : 'transparent',
                border: metric === m ? '1px solid var(--border-light)' : '1px solid transparent',
                color: metric === m ? 'var(--text)' : 'var(--text-muted)',
              }}
            >
              {m === 'sessions' ? 'Sessoes' : 'Usuarios'}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Carregando...</div>
      )}

      {!loading && (
        <div
          className="rounded-xl p-5 fade-up"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
          }}
        >
          {/* Tooltip */}
          {hovered && (
            <div
              className="mb-3 text-xs"
              style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)' }}
            >
              {DAY_LABELS[hovered.dayOfWeek]} {String(hovered.hour).padStart(2, '0')}h
              {' — '}
              <span style={{ color: 'var(--accent)' }}>{formatNumber(hovered.sessions)} sessoes</span>
              {' / '}
              <span style={{ color: 'var(--teal)' }}>{formatNumber(hovered.users)} usuarios</span>
            </div>
          )}
          {!hovered && (
            <div
              className="mb-3 text-xs"
              style={{ color: 'var(--text-muted)' }}
            >
              Passe o mouse sobre uma celula para ver detalhes
            </div>
          )}

          {/* Grid header — days */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '40px repeat(7, 1fr)',
              gap: '2px',
            }}
          >
            {/* Corner */}
            <div />
            {DAY_LABELS.map((day, i) => (
              <div
                key={i}
                className="text-center text-[10px] font-semibold tracking-wider pb-2"
                style={{ color: 'var(--text-muted)' }}
              >
                {day}
              </div>
            ))}

            {/* Rows: 24 hours */}
            {Array.from({ length: 24 }, (_, hour) => (
              <>
                {/* Hour label */}
                <div
                  key={`label-${hour}`}
                  className="flex items-center justify-end pr-2 text-[10px]"
                  style={{ fontFamily: 'var(--mono)', color: 'var(--text-muted)' }}
                >
                  {String(hour).padStart(2, '0')}h
                </div>
                {/* Day cells */}
                {Array.from({ length: 7 }, (_, day) => {
                  const value = getCellValue(day, hour);
                  const opacity = getCellOpacity(value);
                  return (
                    <div
                      key={`${day}-${hour}`}
                      className="rounded-sm cursor-crosshair transition-all"
                      style={{
                        aspectRatio: '1',
                        minHeight: '20px',
                        backgroundColor: `color-mix(in srgb, var(--accent) ${Math.round(opacity * 100)}%, transparent)`,
                        border: hovered?.dayOfWeek === day && hovered?.hour === hour
                          ? '1px solid var(--accent)'
                          : '1px solid transparent',
                      }}
                      onMouseEnter={() => setHovered(findCell(day, hour) ?? { dayOfWeek: day, hour, sessions: 0, users: 0 })}
                      onMouseLeave={() => setHovered(null)}
                      title={`${DAY_LABELS[day]} ${String(hour).padStart(2, '0')}h: ${formatNumber(value)} ${metric}`}
                    />
                  );
                })}
              </>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 mt-4 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Menos</span>
            {[0.1, 0.3, 0.5, 0.7, 0.9].map((opacity) => (
              <div
                key={opacity}
                className="w-4 h-4 rounded-sm"
                style={{
                  backgroundColor: `color-mix(in srgb, var(--accent) ${Math.round(opacity * 100)}%, transparent)`,
                }}
              />
            ))}
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Mais</span>
            {maxValue > 0 && (
              <span
                className="text-[10px] ml-2"
                style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)' }}
              >
                max: {formatNumber(maxValue)}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
