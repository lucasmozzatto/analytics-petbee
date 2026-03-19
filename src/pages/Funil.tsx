import { useEffect, useState, useCallback } from 'react';
import { useTimeWindow } from '../hooks/useGA4Data';
import { getFunil, getFunilPages } from '../lib/api';
import type { FunnelData } from '../types';
import TimeWindowPicker from '../components/TimeWindowPicker';
import CompareToggle from '../components/CompareToggle';
import FunnelChart from '../components/FunnelChart';
import FunnelBlocklistModal from '../components/FunnelBlocklistModal';
import { formatNumber, formatPercent } from '../lib/format';

export default function Funil() {
  const { window, setWindow, startDate, endDate, compare, setCompare } = useTimeWindow();
  const [data, setData] = useState<FunnelData | null>(null);
  const [pages, setPages] = useState<string[]>([]);
  const [selectedPage, setSelectedPage] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [blocklistOpen, setBlocklistOpen] = useState(false);
  const [pageRefreshKey, setPageRefreshKey] = useState(0);

  const handleBlocklistSaved = useCallback(() => {
    setPageRefreshKey((k) => k + 1);
  }, []);

  // Load available pages
  useEffect(() => {
    getFunilPages(startDate, endDate)
      .then((res) => setPages(res.pages))
      .catch(console.error);
  }, [startDate, endDate, pageRefreshKey]);

  // Load funnel data
  useEffect(() => {
    setLoading(true);
    getFunil(startDate, endDate, compare, selectedPage || undefined)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [startDate, endDate, compare, selectedPage]);

  const filteredPages = search
    ? pages.filter((p) => p.toLowerCase().includes(search.toLowerCase()))
    : pages;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Funil</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Funil de conversão por página
        </p>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <TimeWindowPicker value={window} onChange={setWindow} startDate={startDate} endDate={endDate} />
        <CompareToggle enabled={compare} onChange={setCompare} />
      </div>

      {/* Page selector */}
      <div
        className="rounded-xl p-4 space-y-3"
        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold tracking-wider" style={{ color: 'var(--text-muted)' }}>
              FILTRAR POR PÁGINA
            </h3>
            <button
              onClick={() => setBlocklistOpen(true)}
              className="text-sm cursor-pointer transition-opacity hover:opacity-80"
              style={{ color: 'var(--text-muted)' }}
              title="Configurar visibilidade de páginas"
            >
              &#9881;
            </button>
          </div>
          {selectedPage && (
            <button
              onClick={() => setSelectedPage('')}
              className="text-xs px-2 py-1 rounded cursor-pointer transition-colors"
              style={{
                color: 'var(--accent)',
                backgroundColor: 'var(--accent-dim)',
                fontFamily: 'var(--mono)',
              }}
            >
              Limpar filtro
            </button>
          )}
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar página..."
          className="w-full rounded-lg px-3 py-2 text-sm"
          style={{
            backgroundColor: 'var(--surface-alt)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            fontFamily: 'var(--mono)',
            fontSize: '12px',
          }}
        />

        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
          <button
            onClick={() => setSelectedPage('')}
            className="px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
            style={{
              fontFamily: 'var(--mono)',
              fontSize: '11px',
              backgroundColor: !selectedPage ? 'var(--accent-dim)' : 'transparent',
              border: !selectedPage ? '1px solid var(--accent)' : '1px solid var(--border)',
              color: !selectedPage ? 'var(--accent)' : 'var(--text-muted)',
            }}
          >
            Todas
          </button>
          {filteredPages.map((page) => (
            <button
              key={page}
              onClick={() => setSelectedPage(page)}
              className="px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer truncate max-w-[300px]"
              title={page}
              style={{
                fontFamily: 'var(--mono)',
                fontSize: '11px',
                backgroundColor: selectedPage === page ? 'var(--accent-dim)' : 'transparent',
                border: selectedPage === page ? '1px solid var(--accent)' : '1px solid var(--border)',
                color: selectedPage === page ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >
              {page}
            </button>
          ))}
        </div>

        {selectedPage && (
          <div className="text-xs" style={{ color: 'var(--text-dim)', fontFamily: 'var(--mono)' }}>
            Filtrando: {selectedPage}
          </div>
        )}
      </div>

      {loading && (
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Carregando...</div>
      )}

      {data && !loading && (
        <>
          <FunnelChart steps={data.steps} stepConversions={data.stepConversions} />

          {/* Drop-off table */}
          {data.stepConversions.length > 0 && (
            <div
              className="rounded-xl overflow-hidden fade-up"
              style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="p-4 pb-0">
                <h3 className="text-xs font-semibold tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  DROP-OFF POR ETAPA
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['De', 'Para', 'Perdidos', 'Taxa Conversão'].map((h) => (
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
                    {data.stepConversions.map((conv, i) => {
                      const fromStep = data.steps.find((s) => s.name === conv.from);
                      const toStep = data.steps.find((s) => s.name === conv.to);
                      const lost = (fromStep?.count ?? 0) - (toStep?.count ?? 0);
                      return (
                        <tr
                          key={`${conv.from}-${conv.to}`}
                          className="fade-up"
                          style={{
                            borderBottom: '1px solid var(--border)',
                            animationDelay: `${i * 0.04}s`,
                          }}
                        >
                          <td className="px-4 py-3">{conv.from}</td>
                          <td className="px-4 py-3">{conv.to}</td>
                          <td className="px-4 py-3 text-right" style={{ fontFamily: 'var(--mono)', color: 'var(--red)' }}>
                            -{formatNumber(lost)}
                          </td>
                          <td className="px-4 py-3 text-right" style={{ fontFamily: 'var(--mono)', color: 'var(--accent)' }}>
                            {formatPercent(conv.rate)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      <FunnelBlocklistModal
        open={blocklistOpen}
        onClose={() => setBlocklistOpen(false)}
        onSaved={handleBlocklistSaved}
      />
    </div>
  );
}
