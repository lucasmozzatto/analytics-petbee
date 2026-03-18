import { useEffect, useState } from 'react';
import { useTimeWindow } from '../hooks/useGA4Data';
import { getPaginas } from '../lib/api';
import type { PageRow } from '../types';
import TimeWindowPicker from '../components/TimeWindowPicker';
import PageTable from '../components/PageTable';

export default function Paginas() {
  const { window, setWindow, startDate, endDate } = useTimeWindow();
  const [data, setData] = useState<PageRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getPaginas(startDate, endDate, page, pageSize)
      .then((res) => {
        setData(res.data);
        setTotal(res.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [startDate, endDate, page, pageSize]);

  // Reset page when time window changes
  useEffect(() => {
    setPage(1);
  }, [window]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Páginas</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Top páginas por visualizações e conversão</p>
      </div>

      <TimeWindowPicker value={window} onChange={setWindow} />

      {loading ? (
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Carregando...</div>
      ) : (
        <PageTable
          data={data}
          total={total}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}
    </div>
  );
}
