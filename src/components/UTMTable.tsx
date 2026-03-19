import type { UTMRow } from '../types';
import { formatNumber, formatPercent } from '../lib/format';

interface UTMTableProps {
  data: UTMRow[];
  dimensionLabel: string;
}

export default function UTMTable({ data, dimensionLabel }: UTMTableProps) {
  const bestContractRate = Math.max(...data.map((r) => r.convRateContract));

  return (
    <div
      className="rounded-xl overflow-hidden fade-up"
      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {[dimensionLabel, 'Sessões', 'Leads', 'Vendas', 'Conv. Lead', 'Conv. Venda'].map((h) => (
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
              const isBest = row.convRateContract === bestContractRate && bestContractRate > 0;
              const isWaste = row.sessions > 50 && row.convRateContract < 0.1;
              return (
                <tr
                  key={row.value}
                  className="transition-colors fade-up"
                  style={{
                    borderBottom: '1px solid var(--border)',
                    animationDelay: `${i * 0.04}s`,
                    backgroundColor: isBest
                      ? 'var(--accent-dim)'
                      : isWaste
                        ? 'var(--red-dim)'
                        : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isBest && !isWaste) e.currentTarget.style.backgroundColor = 'var(--surface-alt)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isBest && !isWaste) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <td className="px-4 py-3 truncate max-w-[300px]" title={row.value}>
                    {row.value === '(not set)' ? '—' : row.value}
                  </td>
                  <td className="px-4 py-3 text-right" style={{ fontFamily: 'var(--mono)' }}>{formatNumber(row.sessions)}</td>
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
