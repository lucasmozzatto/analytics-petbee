import type { SourceMediumRow } from '../types';
import { formatNumber, formatPercent } from '../lib/format';

interface SourceMediumTableProps {
  data: SourceMediumRow[];
}

export default function SourceMediumTable({ data }: SourceMediumTableProps) {
  return (
    <div
      className="rounded-xl overflow-hidden fade-up"
      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="p-4 pb-0">
        <h3 className="text-xs font-semibold tracking-wider" style={{ color: 'var(--text-muted)' }}>
          SOURCE / MEDIUM
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Source', 'Medium', 'Sessões', 'Usuários', 'Leads', 'Vendas', 'Conv. Lead', 'Conv. Venda'].map((h) => (
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
            {data.map((row, i) => (
              <tr
                key={`${row.source}-${row.medium}`}
                className="transition-colors fade-up"
                style={{
                  borderBottom: '1px solid var(--border)',
                  animationDelay: `${i * 0.04}s`,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-alt)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <td className="px-4 py-3 truncate max-w-[200px]" title={row.source}>
                  {row.source === '(not set)' ? '—' : row.source}
                </td>
                <td className="px-4 py-3 truncate max-w-[150px]" title={row.medium}>
                  {row.medium === '(not set)' ? '—' : row.medium}
                </td>
                <td className="px-4 py-3 text-right" style={{ fontFamily: 'var(--mono)' }}>{formatNumber(row.sessions)}</td>
                <td className="px-4 py-3 text-right" style={{ fontFamily: 'var(--mono)' }}>{formatNumber(row.users)}</td>
                <td className="px-4 py-3 text-right" style={{ fontFamily: 'var(--mono)' }}>{formatNumber(row.leads)}</td>
                <td className="px-4 py-3 text-right" style={{ fontFamily: 'var(--mono)' }}>{formatNumber(row.contracts)}</td>
                <td className="px-4 py-3 text-right" style={{ fontFamily: 'var(--mono)', color: 'var(--accent)' }}>{formatPercent(row.convRateLead)}</td>
                <td className="px-4 py-3 text-right" style={{ fontFamily: 'var(--mono)', color: 'var(--teal)' }}>{formatPercent(row.convRateContract)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
