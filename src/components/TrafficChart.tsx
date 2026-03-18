import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import type { TimeseriesPoint } from '../types';
import { formatDateBR, formatNumber } from '../lib/format';

interface TrafficChartProps {
  data: TimeseriesPoint[];
}

export default function TrafficChart({ data }: TrafficChartProps) {
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
        SESSÕES E USUÁRIOS
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
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
            formatter={(value: any) => [formatNumber(Number(value)), undefined]}
          />
          <Line
            type="monotone"
            dataKey="sessions"
            stroke="var(--accent)"
            strokeWidth={2}
            dot={false}
            name="Sessões"
          />
          <Line
            type="monotone"
            dataKey="users"
            stroke="var(--teal)"
            strokeWidth={2}
            dot={false}
            name="Usuários"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
