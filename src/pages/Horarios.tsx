import { useEffect, useState, useMemo } from 'react';
import { useTimeWindow } from '../hooks/useGA4Data';
import { getHorarios } from '../lib/api';
import { formatNumber, formatCompact } from '../lib/format';
import type { HeatmapCell } from '../types';
import TimeWindowPicker from '../components/TimeWindowPicker';

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
const DAY_LABELS_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export default function Horarios() {
  const { window, setWindow, startDate, endDate, customStart, customEnd, setCustomRange } = useTimeWindow();
  const [data, setData] = useState<HeatmapCell[]>([]);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState<'sessions' | 'users'>('sessions');
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    getHorarios(startDate, endDate)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  const { grid, maxValue, dayTotals, hourTotals, totalAll, peakCell, peakDay, peakHour } = useMemo(() => {
    const grid: Record<string, number> = {};
    const cellData: Record<string, HeatmapCell> = {};
    let max = 0;
    const dayTotals = Array(7).fill(0) as number[];
    const hourTotals = Array(24).fill(0) as number[];
    let totalAll = 0;

    for (const cell of data) {
      const key = `${cell.dayOfWeek}-${cell.hour}`;
      const val = metric === 'sessions' ? cell.sessions : cell.users;
      grid[key] = val;
      cellData[key] = cell;
      if (val > max) max = val;
      dayTotals[cell.dayOfWeek] += val;
      hourTotals[cell.hour] += val;
      totalAll += val;
    }

    // Peak cell
    let peakCell: { day: number; hour: number; value: number } | null = null;
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        const v = grid[`${d}-${h}`] ?? 0;
        if (!peakCell || v > peakCell.value) peakCell = { day: d, hour: h, value: v };
      }
    }

    // Peak day
    let peakDay = 0;
    for (let d = 1; d < 7; d++) {
      if (dayTotals[d] > dayTotals[peakDay]) peakDay = d;
    }

    // Peak hour
    let peakHour = 0;
    for (let h = 1; h < 24; h++) {
      if (hourTotals[h] > hourTotals[peakHour]) peakHour = h;
    }

    return { grid, maxValue: max, dayTotals, hourTotals, totalAll, peakCell, peakDay, peakHour };
  }, [data, metric]);

  function getCellValue(day: number, hour: number): number {
    return grid[`${day}-${hour}`] ?? 0;
  }

  function getCellIntensity(value: number): number {
    if (maxValue === 0) return 0;
    return value / maxValue;
  }

  const metricLabel = metric === 'sessions' ? 'sessões' : 'usuários';

  // Hovered cell info
  const hoveredValue = hoveredDay !== null && hoveredHour !== null
    ? getCellValue(hoveredDay, hoveredHour)
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Horários</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Distribuição de {metricLabel} por dia da semana e hora do dia
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
              {m === 'sessions' ? 'Sessões' : 'Usuários'}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Carregando...</div>
      )}

      {!loading && data.length > 0 && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                label: 'PICO DO DIA',
                value: DAY_LABELS_FULL[peakDay],
                sub: `${formatNumber(dayTotals[peakDay])} ${metricLabel}`,
                color: 'var(--accent)',
              },
              {
                label: 'HORÁRIO DE PICO',
                value: `${String(peakHour).padStart(2, '0')}h`,
                sub: `${formatNumber(hourTotals[peakHour])} ${metricLabel}`,
                color: 'var(--teal)',
              },
              {
                label: 'PICO ABSOLUTO',
                value: peakCell
                  ? `${DAY_LABELS[peakCell.day]} ${String(peakCell.hour).padStart(2, '0')}h`
                  : '—',
                sub: peakCell ? `${formatNumber(peakCell.value)} ${metricLabel}` : '—',
                color: 'var(--blue)',
              },
            ].map((card, i) => (
              <div
                key={card.label}
                className="rounded-xl p-4 fade-up"
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  animationDelay: `${i * 0.04}s`,
                }}
              >
                <div
                  className="text-[10px] font-semibold tracking-widest mb-2"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {card.label}
                </div>
                <div
                  className="text-xl font-bold"
                  style={{ fontFamily: 'var(--mono)', color: card.color }}
                >
                  {card.value}
                </div>
                <div
                  className="text-xs mt-1"
                  style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)' }}
                >
                  {card.sub}
                </div>
              </div>
            ))}
          </div>

          {/* Heatmap */}
          <div
            className="rounded-xl p-5 fade-up"
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              animationDelay: '0.12s',
            }}
          >
            {/* Hover readout */}
            <div
              className="mb-4 h-5 text-xs"
              style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)' }}
            >
              {hoveredDay !== null && hoveredHour !== null ? (
                <>
                  <span style={{ color: 'var(--text)' }}>
                    {DAY_LABELS_FULL[hoveredDay]} às {String(hoveredHour).padStart(2, '0')}h
                  </span>
                  {' — '}
                  <span style={{ color: 'var(--accent)' }}>
                    {formatNumber(hoveredValue ?? 0)} {metricLabel}
                  </span>
                  {totalAll > 0 && (
                    <span style={{ color: 'var(--text-muted)' }}>
                      {' '}({((hoveredValue ?? 0) / totalAll * 100).toFixed(1)}% do total)
                    </span>
                  )}
                </>
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>
                  Passe o mouse para ver detalhes
                </span>
              )}
            </div>

            {/* Grid: hour labels (left) + 7 day columns + row totals (right) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '36px repeat(7, 1fr) 52px',
                gap: '2px',
              }}
            >
              {/* Header row: corner + day labels + "Total" */}
              <div />
              {DAY_LABELS.map((day, i) => (
                <div
                  key={`header-${i}`}
                  className="text-center text-[10px] font-semibold tracking-wider pb-2"
                  style={{
                    color: hoveredDay === i ? 'var(--text)' : (i === 0 || i === 6) ? 'var(--text-muted)' : 'var(--text-dim)',
                    transition: 'color 0.1s',
                  }}
                >
                  {day}
                </div>
              ))}
              <div
                className="text-center text-[10px] font-semibold tracking-wider pb-2"
                style={{ color: 'var(--text-muted)' }}
              >
                Total
              </div>

              {/* 24 hour rows */}
              {Array.from({ length: 24 }, (_, hour) => {
                const isHoveredRow = hoveredHour === hour;
                return (
                  <div key={`row-${hour}`} style={{ display: 'contents' }}>
                    {/* Hour label */}
                    <div
                      className="flex items-center justify-end pr-2 text-[10px]"
                      style={{
                        fontFamily: 'var(--mono)',
                        color: isHoveredRow ? 'var(--text)' : 'var(--text-muted)',
                        transition: 'color 0.1s',
                        height: '22px',
                      }}
                    >
                      {String(hour).padStart(2, '0')}
                    </div>

                    {/* Day cells */}
                    {Array.from({ length: 7 }, (_, day) => {
                      const value = getCellValue(day, hour);
                      const intensity = getCellIntensity(value);
                      const isHovered = hoveredDay === day && hoveredHour === hour;
                      const isCrossHair = hoveredDay === day || hoveredHour === hour;

                      // Color intensity: emerald at varying alpha
                      const alpha = value === 0 ? 0.03 : 0.06 + intensity * 0.88;

                      return (
                        <div
                          key={`cell-${day}-${hour}`}
                          className="rounded-[3px] cursor-crosshair flex items-center justify-center"
                          style={{
                            height: '22px',
                            backgroundColor: `rgba(16, 185, 129, ${alpha})`,
                            outline: isHovered
                              ? '1.5px solid var(--accent)'
                              : isCrossHair
                                ? '1px solid rgba(16, 185, 129, 0.2)'
                                : '1px solid transparent',
                            outlineOffset: '-1px',
                            transition: 'outline 0.08s, background-color 0.08s',
                          }}
                          onMouseEnter={() => { setHoveredDay(day); setHoveredHour(hour); }}
                          onMouseLeave={() => { setHoveredDay(null); setHoveredHour(null); }}
                          title={`${DAY_LABELS_FULL[day]} ${String(hour).padStart(2, '0')}h: ${formatNumber(value)} ${metricLabel}`}
                        >
                          {/* Show value inside cell if intensity is high enough and grid is wide enough */}
                          {intensity > 0.5 && (
                            <span
                              className="text-[8px] leading-none select-none"
                              style={{
                                fontFamily: 'var(--mono)',
                                color: intensity > 0.7 ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.5)',
                              }}
                            >
                              {formatCompact(value)}
                            </span>
                          )}
                        </div>
                      );
                    })}

                    {/* Row total */}
                    <div
                      className="flex items-center justify-end text-[10px] pr-1"
                      style={{
                        fontFamily: 'var(--mono)',
                        color: isHoveredRow ? 'var(--accent)' : 'var(--text-muted)',
                        transition: 'color 0.1s',
                        height: '22px',
                      }}
                    >
                      {formatCompact(hourTotals[hour])}
                    </div>
                  </div>
                );
              })}

              {/* Footer row: column totals */}
              <div
                className="flex items-center justify-end pr-2 text-[10px] pt-1"
                style={{ color: 'var(--text-muted)' }}
              />
              {Array.from({ length: 7 }, (_, day) => (
                <div
                  key={`total-${day}`}
                  className="text-center text-[10px] pt-1"
                  style={{
                    fontFamily: 'var(--mono)',
                    color: hoveredDay === day ? 'var(--accent)' : 'var(--text-muted)',
                    transition: 'color 0.1s',
                  }}
                >
                  {formatCompact(dayTotals[day])}
                </div>
              ))}
              <div
                className="text-right text-[10px] pt-1 pr-1"
                style={{
                  fontFamily: 'var(--mono)',
                  color: 'var(--text-dim)',
                }}
              >
                {formatCompact(totalAll)}
              </div>
            </div>

            {/* Legend + footer */}
            <div
              className="flex items-center justify-between mt-4 pt-3 flex-wrap gap-2"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Menos</span>
                {[0.03, 0.15, 0.35, 0.55, 0.75, 0.94].map((a) => (
                  <div
                    key={a}
                    className="rounded-[2px]"
                    style={{
                      width: '14px',
                      height: '14px',
                      backgroundColor: `rgba(16, 185, 129, ${a})`,
                    }}
                  />
                ))}
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Mais</span>
              </div>
              {maxValue > 0 && (
                <span
                  className="text-[10px]"
                  style={{ fontFamily: 'var(--mono)', color: 'var(--text-muted)' }}
                >
                  máx: {formatNumber(maxValue)} {metricLabel}/slot
                </span>
              )}
            </div>
          </div>

          {/* Top hours ranking */}
          <div
            className="rounded-xl overflow-hidden fade-up"
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              animationDelay: '0.2s',
            }}
          >
            <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <span
                className="text-[10px] font-semibold tracking-widest"
                style={{ color: 'var(--text-muted)' }}
              >
                TOP 10 HORÁRIOS
              </span>
            </div>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['#', 'Dia', 'Hora', 'Sessões', 'Usuários', '% Total'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-left text-[10px] font-semibold tracking-widest"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data
                  .filter((c) => (metric === 'sessions' ? c.sessions : c.users) > 0)
                  .sort((a, b) =>
                    metric === 'sessions'
                      ? b.sessions - a.sessions
                      : b.users - a.users
                  )
                  .slice(0, 10)
                  .map((cell, i) => {
                    const val = metric === 'sessions' ? cell.sessions : cell.users;
                    const pct = totalAll > 0 ? (val / totalAll) * 100 : 0;
                    return (
                      <tr
                        key={`${cell.dayOfWeek}-${cell.hour}`}
                        className="fade-up"
                        style={{
                          borderBottom: i < 9 ? '1px solid var(--border)' : undefined,
                          animationDelay: `${0.24 + i * 0.02}s`,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-alt)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <td
                          className="px-4 py-2.5 text-xs"
                          style={{ fontFamily: 'var(--mono)', color: 'var(--text-muted)' }}
                        >
                          {i + 1}
                        </td>
                        <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--text)' }}>
                          {DAY_LABELS_FULL[cell.dayOfWeek]}
                        </td>
                        <td
                          className="px-4 py-2.5 text-sm"
                          style={{ fontFamily: 'var(--mono)', color: 'var(--accent)' }}
                        >
                          {String(cell.hour).padStart(2, '0')}h
                        </td>
                        <td
                          className="px-4 py-2.5 text-sm text-right"
                          style={{ fontFamily: 'var(--mono)', color: 'var(--text)' }}
                        >
                          {formatNumber(cell.sessions)}
                        </td>
                        <td
                          className="px-4 py-2.5 text-sm text-right"
                          style={{ fontFamily: 'var(--mono)', color: 'var(--teal)' }}
                        >
                          {formatNumber(cell.users)}
                        </td>
                        <td
                          className="px-4 py-2.5 text-sm text-right"
                          style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)' }}
                        >
                          {pct.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!loading && data.length === 0 && (
        <div
          className="rounded-xl p-8 text-center text-sm"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
          }}
        >
          Sem dados para o período selecionado
        </div>
      )}
    </div>
  );
}
