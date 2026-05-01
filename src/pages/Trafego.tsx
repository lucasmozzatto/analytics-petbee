import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useTimeWindow } from '../hooks/useGA4Data';
import { getTrafego, getTrafegoMonthly } from '../lib/api';
import type { TrafegoResponse, TrafegoMonthlyPoint } from '../types';
import TimeWindowPicker from '../components/TimeWindowPicker';
import CompareToggle from '../components/CompareToggle';
import ChannelTable from '../components/ChannelTable';
import ChannelStackedAreaChart from '../components/ChannelStackedAreaChart';
import SourceMediumTable from '../components/SourceMediumTable';
import { formatDateBR, formatNumber } from '../lib/format';

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// Anchor for the long-horizon monthly view; matches ALL_TIME_START in useGA4Data.
const MONTHLY_START = '2024-01-01';

function formatMonthTick(value: string): string {
  const [y, m] = value.split('-');
  return `${MONTH_LABELS[parseInt(m, 10) - 1]}/${y.slice(2)}`;
}

function formatMonthLabel(value: string): string {
  const [y, m] = value.split('-');
  return `${MONTH_LABELS[parseInt(m, 10) - 1]}/${y}`;
}

export default function Trafego() {
  const { window, setWindow, startDate, endDate, compare, setCompare, customStart, customEnd, setCustomRange } = useTimeWindow();
  const [data, setData] = useState<TrafegoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [monthly, setMonthly] = useState<TrafegoMonthlyPoint[] | null>(null);
  const [monthlyLoading, setMonthlyLoading] = useState(true);
  const [selectedChannels, setSelectedChannels] = useState<Set<string> | null>(null);

  useEffect(() => {
    setLoading(true);
    getTrafego(startDate, endDate, compare)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [startDate, endDate, compare]);

  const monthlyEnd = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  useEffect(() => {
    setMonthlyLoading(true);
    getTrafegoMonthly(MONTHLY_START, monthlyEnd)
      .then(setMonthly)
      .catch(console.error)
      .finally(() => setMonthlyLoading(false));
  }, [monthlyEnd]);

  // Channels sorted by total sessions DESC — used for chip order.
  const channels = useMemo(() => {
    if (!monthly) return [];
    const totals = new Map<string, number>();
    for (const row of monthly) {
      const ch = row.channel || '(unknown)';
      totals.set(ch, (totals.get(ch) ?? 0) + row.sessions);
    }
    return Array.from(totals.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);
  }, [monthly]);

  // Initialize selection to all channels once data arrives.
  useEffect(() => {
    if (channels.length > 0 && selectedChannels === null) {
      setSelectedChannels(new Set(channels));
    }
  }, [channels, selectedChannels]);

  // Aggregate monthly sessions, summing only the selected channels.
  const monthlyAggregated = useMemo(() => {
    if (!monthly) return [];
    const filterSet = selectedChannels ?? new Set(channels);
    const byMonth = new Map<string, number>();
    for (const row of monthly) {
      if (!filterSet.has(row.channel || '(unknown)')) continue;
      byMonth.set(row.date, (byMonth.get(row.date) ?? 0) + row.sessions);
    }
    return Array.from(byMonth.entries())
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([date, sessions]) => ({ date, sessions }));
  }, [monthly, selectedChannels, channels]);

  function toggleChannel(channel: string) {
    setSelectedChannels((prev) => {
      const base = prev ?? new Set(channels);
      const next = new Set(base);
      if (next.has(channel)) {
        // Don't allow zero selection — chart would be empty.
        if (next.size === 1) return next;
        next.delete(channel);
      } else {
        next.add(channel);
      }
      return next;
    });
  }

  const allSelected = selectedChannels && channels.length > 0 && selectedChannels.size === channels.length;

  function selectAll() {
    setSelectedChannels(new Set(channels));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Tráfego</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Sessões por canal e fonte/mídia</p>
      </div>

      {/* Crescimento mensal: visão estratégica de longo prazo, independente do TimeWindowPicker */}
      <div
        className="rounded-xl p-6 fade-up"
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="flex items-baseline justify-between mb-4">
          <h3
            className="text-xs font-semibold tracking-wider"
            style={{ color: 'var(--text-muted)' }}
          >
            CRESCIMENTO MENSAL — SESSÕES TOTAIS
          </h3>
          <span className="text-[10px]" style={{ color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
            desde {formatDateBR(MONTHLY_START)}
          </span>
        </div>

        {channels.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <button
              type="button"
              onClick={selectAll}
              className="px-2.5 py-1 rounded-md text-[11px] transition-colors"
              style={{
                fontFamily: 'var(--mono)',
                backgroundColor: allSelected ? 'var(--surface-alt)' : 'transparent',
                border: `1px solid ${allSelected ? 'var(--border-light)' : 'var(--border)'}`,
                color: allSelected ? 'var(--text)' : 'var(--text-muted)',
              }}
            >
              Todos
            </button>
            {channels.map((ch) => {
              const active = selectedChannels?.has(ch) ?? true;
              return (
                <button
                  key={ch}
                  type="button"
                  onClick={() => toggleChannel(ch)}
                  className="px-2.5 py-1 rounded-md text-[11px] transition-colors"
                  style={{
                    fontFamily: 'var(--mono)',
                    backgroundColor: active ? 'var(--surface-alt)' : 'transparent',
                    border: `1px solid ${active ? 'var(--border-light)' : 'var(--border)'}`,
                    color: active ? 'var(--text)' : 'var(--text-muted)',
                  }}
                >
                  {ch}
                </button>
              );
            })}
          </div>
        )}

        {monthlyLoading && (
          <div className="text-sm py-12 text-center" style={{ color: 'var(--text-muted)' }}>
            Carregando...
          </div>
        )}
        {!monthlyLoading && monthlyAggregated.length > 0 && (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={monthlyAggregated} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatMonthTick}
                fontSize={12}
                fontFamily="var(--mono)"
                stroke="var(--text-muted)"
                tickLine={false}
                axisLine={false}
                interval={0}
              />
              <YAxis
                fontSize={12}
                fontFamily="var(--mono)"
                stroke="var(--text-muted)"
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => formatNumber(v)}
              />
              <Tooltip
                cursor={{ stroke: 'var(--border-light)', strokeWidth: 1 }}
                contentStyle={{
                  backgroundColor: 'var(--surface-alt)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '8px',
                  fontFamily: 'var(--mono)',
                  fontSize: '12px',
                }}
                labelFormatter={(label: any) => formatMonthLabel(String(label))}
                formatter={(value: any) => [formatNumber(Number(value)), 'Sessões']}
              />
              <Line
                type="monotone"
                dataKey="sessions"
                stroke="var(--accent)"
                strokeWidth={2}
                dot={{ r: 4, fill: 'var(--accent)', strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
        {!monthlyLoading && monthlyAggregated.length === 0 && (
          <div className="text-sm py-12 text-center" style={{ color: 'var(--text-muted)' }}>
            Sem dados de sessões ainda.
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <TimeWindowPicker value={window} onChange={setWindow} startDate={startDate} endDate={endDate} customStart={customStart} customEnd={customEnd} onCustomRange={setCustomRange} />
        <CompareToggle enabled={compare} onChange={setCompare} />
      </div>

      {loading && (
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Carregando...</div>
      )}

      {data && !loading && (
        <>
          <ChannelStackedAreaChart data={data.byChannelDaily} />
          <ChannelTable
            data={data.byChannel}
            previous={compare ? data.previous?.byChannel : undefined}
          />
          <SourceMediumTable data={data.bySourceMedium} />
        </>
      )}
    </div>
  );
}
