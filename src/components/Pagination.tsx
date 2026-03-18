interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const PAGE_SIZES = [10, 20, 50];

export default function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  if (total === 0) return null;

  return (
    <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2">
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Exibir
        </span>
        {PAGE_SIZES.map((size) => (
          <button
            key={size}
            onClick={() => { onPageSizeChange(size); onPageChange(1); }}
            className="px-2 py-0.5 rounded text-xs cursor-pointer transition-colors"
            style={{
              fontFamily: 'var(--mono)',
              backgroundColor: pageSize === size ? 'var(--surface-alt)' : 'transparent',
              color: pageSize === size ? 'var(--text)' : 'var(--text-muted)',
              border: pageSize === size ? '1px solid var(--border-light)' : '1px solid transparent',
            }}
          >
            {size}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
          {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} de {total}
        </span>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-2 py-0.5 rounded text-xs cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ color: 'var(--text-dim)', border: '1px solid var(--border)' }}
        >
          ‹
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-2 py-0.5 rounded text-xs cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ color: 'var(--text-dim)', border: '1px solid var(--border)' }}
        >
          ›
        </button>
      </div>
    </div>
  );
}
