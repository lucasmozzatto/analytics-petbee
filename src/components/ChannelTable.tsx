import type { ChannelRow } from '../types';
import { formatNumber, formatPercent, formatDuration } from '../lib/format';
import DeltaBadge from './DeltaBadge';

interface ChannelTableProps {
  data: ChannelRow[];
  previous?: ChannelRow[];
}

const CHANNEL_COLORS: Record<string, string> = {
  'Organic Search': 'var(--accent)',
  'Paid Search': 'var(--amber)',
  'Direct': 'var(--blue)',
  'Referral': 'var(--purple)',
  'Organic Social': 'var(--orange)',
  'Paid Social': 'var(--orange)',
  'Email': 'var(--teal)',
};

export default function ChannelTable({ data, previous }: ChannelTableProps) {
  const getPrev = (channel: string) => previous?.find((p) => p.channel === channel);

  return (
    <div
      className="rounded-xl overflow-hidden fade-up"
      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="p-4 pb-0">
        <h3 className="text-xs font-semibold tracking-wider" style={{ color: 'var(--text-muted)' }}>
          SESSÕES POR CANAL
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Canal', 'Sessões', 'Usuários', 'Bounce Rate', 'Duração', 'Leads', 'Contratos', 'Conv. Lead', 'Conv. Contrato'].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-[10px] font-semibold tracking-wider"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => {
              const prev = getPrev(row.channel);
              return (
                <tr
                  key={row.channel}
                  className="transition-colors fade-up"
                  style={{
                    borderBottom: '1px solid var(--border)',
                    animationDelay: `${i * 0.04}s`,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-alt)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: CHANNEL_COLORS[row.channel] || 'var(--text-muted)' }}
                      />
                      {row.channel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right" style={{ fontFamily: 'var(--mono)' }}>
                    {formatNumber(row.sessions)}
                    {prev && <span className="ml-2"><DeltaBadge current={row.sessions} previous={prev.sessions} /></span>}
                  </td>
                  <td className="px-4 py-3 text-right" style={{ fontFamily: 'var(--mono)' }}>{formatNumber(row.users)}</td>
                  <td className="px-4 py-3 text-right" style={{ fontFamily: 'var(--mono)' }}>{formatPercent(row.bounceRate)}</td>
                  <td className="px-4 py-3 text-right" style={{ fontFamily: 'var(--mono)' }}>{formatDuration(row.avgSessionDuration)}</td>
                  <td className="px-4 py-3 text-right" style={{ fontFamily: 'var(--mono)' }}>{formatNumber(row.leads)}</td>
                  <td className="px-4 py-3 text-right" style={{ fontFamily: 'var(--mono)' }}>{formatNumber(row.contracts)}</td>
                  <td className="px-4 py-3 text-right" style={{ fontFamily: 'var(--mono)', color: 'var(--accent)' }}>{formatPercent(row.convRateLead)}</td>
                  <td className="px-4 py-3 text-right" style={{ fontFamily: 'var(--mono)', color: 'var(--teal)' }}>{formatPercent(row.convRateContract)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
