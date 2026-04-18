import { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { ChannelDailyPoint } from '../types';
import { formatDateBR, formatNumber } from '../lib/format';

interface ChannelStackedAreaChartProps {
  data: ChannelDailyPoint[];
}

const CHANNEL_COLORS: Record<string, string> = {
  'Organic Search': 'var(--accent)',
  'Paid Search': 'var(--amber)',
  Direct: 'var(--blue)',
  Referral: 'var(--purple)',
  'Organic Social': 'var(--orange)',
  'Paid Social': 'var(--orange)',
  Email: 'var(--teal)',
  Display: 'var(--red)',
  'Cross-network': 'var(--purple)',
};

const FALLBACK_COLORS = [
  'var(--teal)',
  'var(--purple)',
  'var(--red)',
  'var(--blue)',
  'var(--amber)',
  'var(--orange)',
];

function colorFor(channel: string, index: number): string {
  return CHANNEL_COLORS[channel] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

export default function ChannelStackedAreaChart({ data }: ChannelStackedAreaChartProps) {
  const { rows, channels } = useMemo(() => {
    const totals = new Map<string, number>();
    const dateMap = new Map<string, Record<string, number>>();

    for (const point of data) {
      const channel = point.channel || '(unknown)';
      totals.set(channel, (totals.get(channel) ?? 0) + point.sessions);
      const existing = dateMap.get(point.date) ?? {};
      existing[channel] = (existing[channel] ?? 0) + point.sessions;
      dateMap.set(point.date, existing);
    }

    const channelsSorted = Array.from(totals.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);

    const rowsSorted = Array.from(dateMap.entries())
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([date, perChannel]) => {
        const row: Record<string, string | number> = { date };
        for (const ch of channelsSorted) row[ch] = perChannel[ch] ?? 0;
        return row;
      });

    return { rows: rowsSorted, channels: channelsSorted };
  }, [data]);

  if (channels.length === 0) {
    return null;
  }

  return (
    <div
      className="rounded-xl p-5 fade-up"
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
      }}
    >
      <h3
        className="text-xs font-semibold tracking-wider mb-4"
        style={{ color: 'var(--text-muted)' }}
      >
        SESSÕES DIÁRIAS POR CANAL
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={rows}>
          <defs>
            {channels.map((ch, i) => {
              const color = colorFor(ch, i);
              const gradientId = `grad-${i}`;
              return (
                <linearGradient key={gradientId} id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.6} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.15} />
                </linearGradient>
              );
            })}
          </defs>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(v: string) => {
              const parts = v.split('-');
              return `${parts[2]}/${parts[1]}`;
            }}
            fontSize={12}
            fontFamily="var(--mono)"
            stroke="var(--text-muted)"
            tickLine={false}
            axisLine={false}
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
            contentStyle={{
              backgroundColor: 'var(--surface-alt)',
              border: '1px solid var(--border-light)',
              borderRadius: '8px',
              fontFamily: 'var(--mono)',
              fontSize: '12px',
            }}
            labelFormatter={(label: any) => formatDateBR(String(label))}
            formatter={(value: any, name: any) => [formatNumber(Number(value)), String(name)]}
            itemSorter={(item) => -Number(item.value ?? 0)}
          />
          <Legend
            wrapperStyle={{
              fontFamily: 'var(--mono)',
              fontSize: '11px',
            }}
          />
          {channels.map((ch, i) => {
            const color = colorFor(ch, i);
            return (
              <Area
                key={ch}
                type="monotone"
                dataKey={ch}
                name={ch}
                stackId="1"
                stroke={color}
                strokeWidth={1.5}
                fill={`url(#grad-${i})`}
              />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
