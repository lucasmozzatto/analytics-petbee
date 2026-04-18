import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useTimeWindow } from '../hooks/useGA4Data';
import { getBlog } from '../lib/api';
import type { BlogResponse } from '../types';
import TimeWindowPicker from '../components/TimeWindowPicker';
import { formatDateBR, formatNumber, formatPercent, formatDuration } from '../lib/format';

function bounceColor(rate: number): string {
  if (rate < 40) return 'var(--accent)';
  if (rate < 60) return 'var(--amber)';
  return 'var(--red)';
}

export default function Blog() {
  const { window, setWindow, startDate, endDate, customStart, customEnd, setCustomRange } = useTimeWindow('30d');
  const [data, setData] = useState<BlogResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getBlog(startDate, endDate, 10)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  const totalViews = data?.timeseries.reduce((acc, p) => acc + p.views, 0) ?? 0;
  const peak = data?.timeseries.reduce(
    (max, p) => (p.views > max.views ? p : max),
    { date: '', views: 0 },
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Blog</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Crescimento de tráfego em /blog e top posts
        </p>
      </div>

      <TimeWindowPicker
        value={window}
        onChange={setWindow}
        startDate={startDate}
        endDate={endDate}
        customStart={customStart}
        customEnd={customEnd}
        onCustomRange={setCustomRange}
      />

      {loading && (
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Carregando...</div>
      )}

      {data && !loading && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SummaryCard label="Views totais (/blog)" value={formatNumber(totalViews)} />
            <SummaryCard
              label="Pico diário"
              value={peak && peak.views > 0 ? formatNumber(peak.views) : '—'}
              hint={peak && peak.date ? formatDateBR(peak.date) : undefined}
            />
            <SummaryCard label="Posts no top 10" value={String(data.topPages.length)} />
          </div>

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
              VIEWS DIÁRIAS EM /BLOG
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data.timeseries}>
                <defs>
                  <linearGradient id="blog-views" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.05} />
                  </linearGradient>
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
                  formatter={(value: any) => [formatNumber(Number(value)), 'Views']}
                />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  fill="url(#blog-views)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div
            className="rounded-xl overflow-hidden fade-up"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="p-4 pb-0">
              <h3 className="text-xs font-semibold tracking-wider" style={{ color: 'var(--text-muted)' }}>
                TOP 10 POSTS POR VIEWS
              </h3>
            </div>
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['#', 'Página', 'Título', 'Views', 'Tempo Médio', 'Bounce Rate'].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-[10px] font-semibold tracking-wider"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {h}
                      </th>
                    ))}
                    {/* TODO: coluna `Leads` quando atribuição blog → generate_lead estiver implementada */}
                  </tr>
                </thead>
                <tbody>
                  {data.topPages.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-6 text-center text-sm"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Sem dados de /blog no período.
                      </td>
                    </tr>
                  )}
                  {data.topPages.map((row, i) => (
                    <tr
                      key={row.pagePath}
                      className="transition-colors fade-up"
                      style={{
                        borderBottom: '1px solid var(--border)',
                        animationDelay: `${i * 0.04}s`,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-alt)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td
                        className="px-4 py-3"
                        style={{ fontFamily: 'var(--mono)', color: 'var(--text-muted)', fontSize: '12px' }}
                      >
                        {i + 1}
                      </td>
                      <td
                        className="px-4 py-3 truncate max-w-[260px]"
                        title={row.pagePath}
                        style={{ fontFamily: 'var(--mono)', fontSize: '12px' }}
                      >
                        {row.pagePath}
                      </td>
                      <td className="px-4 py-3 truncate max-w-[260px]" title={row.pageTitle}>
                        {row.pageTitle || '—'}
                      </td>
                      <td className="px-4 py-3 text-right" style={{ fontFamily: 'var(--mono)' }}>
                        {formatNumber(row.views)}
                      </td>
                      <td className="px-4 py-3 text-right" style={{ fontFamily: 'var(--mono)' }}>
                        {formatDuration(row.avgTimeOnPage)}
                      </td>
                      <td
                        className="px-4 py-3 text-right"
                        style={{ fontFamily: 'var(--mono)', color: bounceColor(row.bounceRate) }}
                      >
                        {formatPercent(row.bounceRate)}
                      </td>
                      {/* TODO: célula `Leads` */}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

interface SummaryCardProps {
  label: string;
  value: string;
  hint?: string;
}

function SummaryCard({ label, value, hint }: SummaryCardProps) {
  return (
    <div
      className="rounded-xl p-4 fade-up"
      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div
        className="text-[10px] font-semibold tracking-wider uppercase"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </div>
      <div
        className="text-2xl font-bold mt-1"
        style={{ color: 'var(--text)', fontFamily: 'var(--mono)' }}
      >
        {value}
      </div>
      {hint && (
        <div className="text-xs mt-1" style={{ color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
          {hint}
        </div>
      )}
    </div>
  );
}
