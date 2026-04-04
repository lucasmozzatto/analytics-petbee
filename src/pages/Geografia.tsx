import { useEffect, useState } from 'react';
import { useTimeWindow } from '../hooks/useGA4Data';
import { getGeografia } from '../lib/api';
import { formatNumber, formatPercent, formatDuration } from '../lib/format';
import type { GeoRow } from '../types';
import TimeWindowPicker from '../components/TimeWindowPicker';

type GroupBy = 'region' | 'city';

const TABS: { label: string; value: GroupBy }[] = [
  { label: 'Estado', value: 'region' },
  { label: 'Cidade', value: 'city' },
];

export default function Geografia() {
  const { window, setWindow, startDate, endDate, customStart, customEnd, setCustomRange } = useTimeWindow();
  const [groupBy, setGroupBy] = useState<GroupBy>('region');
  const [data, setData] = useState<GeoRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getGeografia(startDate, endDate, groupBy)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [startDate, endDate, groupBy]);

  const displayValue = (row: GeoRow) => {
    if (groupBy === 'region') return row.region || '\u2014';
    return row.city || '\u2014';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Geografia</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Trafego por estado e cidade
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
      </div>

      {/* Tabs */}
      <div className="flex gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setGroupBy(tab.value)}
            className="px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
            style={{
              fontFamily: 'var(--mono)',
              fontSize: '12px',
              backgroundColor: groupBy === tab.value ? 'var(--surface-alt)' : 'transparent',
              border: groupBy === tab.value ? '1px solid var(--border-light)' : '1px solid transparent',
              color: groupBy === tab.value ? 'var(--text)' : 'var(--text-muted)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Carregando...</div>
      )}

      {!loading && (
        <div
          className="rounded-xl overflow-hidden fade-up"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
          }}
        >
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {[
                  groupBy === 'region' ? 'Estado' : 'Cidade',
                  ...(groupBy === 'city' ? ['Estado'] : []),
                  'Sessoes',
                  'Usuarios',
                  'Novos Usuarios',
                  'Bounce Rate',
                  'Duracao Media',
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {h.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && (
                <tr>
                  <td
                    colSpan={groupBy === 'city' ? 7 : 6}
                    className="px-4 py-8 text-center text-sm"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Sem dados para o periodo selecionado
                  </td>
                </tr>
              )}
              {data.map((row, i) => (
                <tr
                  key={`${row.region}-${row.city}-${i}`}
                  className="fade-up"
                  style={{
                    borderBottom: i < data.length - 1 ? '1px solid var(--border)' : undefined,
                    animationDelay: `${i * 0.02}s`,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-alt)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td
                    className="px-4 py-3 text-sm truncate max-w-[200px]"
                    style={{ color: 'var(--text)' }}
                    title={displayValue(row)}
                  >
                    {displayValue(row)}
                  </td>
                  {groupBy === 'city' && (
                    <td
                      className="px-4 py-3 text-sm truncate max-w-[150px]"
                      style={{ color: 'var(--text-dim)' }}
                      title={row.region || '\u2014'}
                    >
                      {row.region || '\u2014'}
                    </td>
                  )}
                  <td className="px-4 py-3 text-sm text-right" style={{ fontFamily: 'var(--mono)', color: 'var(--text)' }}>
                    {formatNumber(row.sessions)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right" style={{ fontFamily: 'var(--mono)', color: 'var(--text)' }}>
                    {formatNumber(row.users)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right" style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)' }}>
                    {formatNumber(row.newUsers)}
                  </td>
                  <td
                    className="px-4 py-3 text-sm text-right"
                    style={{
                      fontFamily: 'var(--mono)',
                      color: row.bounceRate > 60 ? 'var(--red)' : row.bounceRate > 40 ? 'var(--amber)' : 'var(--accent)',
                    }}
                  >
                    {formatPercent(row.bounceRate)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right" style={{ fontFamily: 'var(--mono)', color: 'var(--text)' }}>
                    {formatDuration(row.avgSessionDuration)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
