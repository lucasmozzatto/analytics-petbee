import type { PageRow } from '../types';
import { formatNumber, formatPercent, formatDuration } from '../lib/format';
import Pagination from './Pagination';

interface PageTableProps {
  data: PageRow[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

function bounceColor(rate: number): string {
  if (rate < 40) return 'var(--accent)';
  if (rate < 60) return 'var(--amber)';
  return 'var(--red)';
}

export default function PageTable({ data, total, page, pageSize, onPageChange, onPageSizeChange }: PageTableProps) {
  return (
    <div
      className="rounded-xl overflow-hidden fade-up"
      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Página', 'Título', 'Views', 'Tempo Médio', 'Bounce Rate'].map((h) => (
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
                key={row.pagePath}
                className="transition-colors fade-up"
                style={{
                  borderBottom: '1px solid var(--border)',
                  animationDelay: `${i * 0.04}s`,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-alt)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <td className="px-4 py-3 truncate max-w-[250px]" title={row.pagePath} style={{ fontFamily: 'var(--mono)', fontSize: '12px' }}>
                  {row.pagePath}
                </td>
                <td className="px-4 py-3 truncate max-w-[200px]" title={row.pageTitle}>
                  {row.pageTitle}
                </td>
                <td className="px-4 py-3 text-right" style={{ fontFamily: 'var(--mono)' }}>{formatNumber(row.views)}</td>
                <td className="px-4 py-3 text-right" style={{ fontFamily: 'var(--mono)' }}>{formatDuration(row.avgTimeOnPage)}</td>
                <td className="px-4 py-3 text-right" style={{ fontFamily: 'var(--mono)', color: bounceColor(row.bounceRate) }}>
                  {formatPercent(row.bounceRate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 pb-4">
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </div>
    </div>
  );
}
