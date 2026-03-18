import { useEffect, useState } from 'react';
import { useTimeWindow } from '../hooks/useGA4Data';
import { getVisaoGeral } from '../lib/api';
import type { VisaoGeralResponse } from '../types';
import { formatNumber, formatPercent } from '../lib/format';
import TimeWindowPicker from '../components/TimeWindowPicker';
import CompareToggle from '../components/CompareToggle';
import KPICards from '../components/KPICards';
import TrafficChart from '../components/TrafficChart';

const CHANNEL_COLORS: Record<string, string> = {
  'Organic Search': 'var(--accent)',
  'Paid Search': 'var(--amber)',
  'Direct': 'var(--blue)',
  'Organic Social': 'var(--orange)',
  'Paid Social': 'var(--orange)',
  'Referral': 'var(--purple)',
  'Email': 'var(--teal)',
};

export default function Visao() {
  const { window, setWindow, startDate, endDate, compare, setCompare } = useTimeWindow();
  const [data, setData] = useState<VisaoGeralResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getVisaoGeral(startDate, endDate, compare)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [startDate, endDate, compare]);

  return (
    <div className="space-y-6">
      <div>
        <span
          className="inline-block text-[10px] font-semibold tracking-wider px-2 py-1 rounded mb-2"
          style={{
            backgroundColor: 'var(--accent-dim)',
            color: 'var(--accent)',
            fontFamily: 'var(--mono)',
          }}
        >
          GA4 PROPERTY
        </span>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Visão Geral</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Analytics da Petbee</p>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <TimeWindowPicker value={window} onChange={setWindow} />
        <CompareToggle enabled={compare} onChange={setCompare} />
      </div>

      {loading && (
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Carregando...</div>
      )}

      {data && !loading && (
        <>
          <KPICards data={data.kpis} previous={compare ? data.previous?.kpis : undefined} />

          <TrafficChart data={data.timeseries} />

          {data.topChannels && data.topChannels.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {data.topChannels.map((ch, i) => (
                <div
                  key={ch.channel}
                  className="rounded-xl p-4 fade-up"
                  style={{
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    animationDelay: `${i * 0.04}s`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: CHANNEL_COLORS[ch.channel] || 'var(--text-muted)' }}
                    />
                    <span className="text-xs" style={{ color: 'var(--text-dim)' }}>{ch.channel}</span>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-lg font-bold" style={{ fontFamily: 'var(--mono)', color: 'var(--text)' }}>
                      {formatNumber(ch.sessions)}
                    </span>
                    <span className="text-xs mb-0.5" style={{ fontFamily: 'var(--mono)', color: 'var(--text-muted)' }}>
                      {formatPercent(ch.percentage, 1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
