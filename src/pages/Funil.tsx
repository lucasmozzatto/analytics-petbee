import { useEffect, useState } from 'react';
import { useTimeWindow } from '../hooks/useGA4Data';
import { getFunil, getFunilPages, getFunilSources, getFunilVariants } from '../lib/api';
import type { FunnelData, FunnelSource, ABVariantSummary } from '../types';
import TimeWindowPicker from '../components/TimeWindowPicker';
import CompareToggle from '../components/CompareToggle';
import FunnelChart from '../components/FunnelChart';
import { formatNumber, formatPercent } from '../lib/format';

const DOMAIN_TABS = [
  { value: '', label: 'Todas', subtitle: null },
  { value: 'lp.petbee.com.br', label: 'Landing Pages', subtitle: 'lp.petbee.com.br' },
  { value: 'petbee.com.br', label: 'Website', subtitle: 'petbee.com.br' },
] as const;

export default function Funil() {
  const { window, setWindow, startDate, endDate, compare, setCompare, customStart, customEnd, setCustomRange } = useTimeWindow();
  const [data, setData] = useState<FunnelData | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [pages, setPages] = useState<string[]>([]);
  const [selectedPage, setSelectedPage] = useState<string>('');
  const [sources, setSources] = useState<FunnelSource[]>([]);
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [variants, setVariants] = useState<ABVariantSummary[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Clamp startDate for website domain (tracking started 2026-03-21)
  const WEBSITE_MIN_DATE = '2026-03-21';
  const isWebsite = selectedDomain === 'petbee.com.br';
  const effectiveStart = isWebsite && startDate < WEBSITE_MIN_DATE ? WEBSITE_MIN_DATE : startDate;

  // Load pages when domain is selected
  useEffect(() => {
    if (!selectedDomain) {
      setPages([]);
      setSelectedPage('');
      return;
    }
    getFunilPages(effectiveStart, endDate, selectedDomain)
      .then((res) => setPages(res.pages))
      .catch(console.error);
  }, [effectiveStart, endDate, selectedDomain]);

  // Reset selected page, source and variant when domain changes
  useEffect(() => {
    setSelectedPage('');
    setSelectedSource('');
    setSelectedVariant('');
    setSearch('');
  }, [selectedDomain]);

  // Reset source and variant when page changes
  useEffect(() => {
    setSelectedSource('');
    setSelectedVariant('');
  }, [selectedPage]);

  // Load sources when domain/page/dates change
  useEffect(() => {
    if (!selectedDomain) {
      setSources([]);
      return;
    }
    getFunilSources(effectiveStart, endDate, selectedDomain, selectedPage || undefined)
      .then((res) => setSources(res.sources))
      .catch(console.error);
  }, [effectiveStart, endDate, selectedDomain, selectedPage]);

  // Load A/B variants when LP domain is selected
  useEffect(() => {
    if (selectedDomain !== 'lp.petbee.com.br') {
      setVariants([]);
      setSelectedVariant('');
      return;
    }
    getFunilVariants(effectiveStart, endDate, selectedDomain, selectedPage || undefined)
      .then((res) => setVariants(res.variants))
      .catch(() => setVariants([]));
  }, [effectiveStart, endDate, selectedDomain, selectedPage]);

  // Load funnel data
  useEffect(() => {
    setLoading(true);
    getFunil(
      effectiveStart,
      endDate,
      compare,
      selectedPage || undefined,
      selectedDomain || undefined,
      selectedSource || undefined,
      selectedVariant || undefined
    )
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [effectiveStart, endDate, compare, selectedDomain, selectedPage, selectedSource, selectedVariant]);

  const filteredPages = search
    ? pages.filter((p) => p.toLowerCase().includes(search.toLowerCase()))
    : pages;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Funil</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Jornada do visitante no site e landing pages
        </p>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <TimeWindowPicker value={window} onChange={setWindow} startDate={effectiveStart} endDate={endDate} customStart={customStart} customEnd={customEnd} onCustomRange={setCustomRange} />
        <CompareToggle enabled={compare} onChange={setCompare} />
      </div>

      {/* Domain tabs */}
      <div className="flex items-center gap-2">
        {DOMAIN_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setSelectedDomain(tab.value)}
            className="px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
            style={{
              backgroundColor: selectedDomain === tab.value ? 'var(--accent-dim)' : 'transparent',
              border: selectedDomain === tab.value ? '1px solid var(--accent)' : '1px solid var(--border)',
              color: selectedDomain === tab.value ? 'var(--accent)' : 'var(--text-muted)',
            }}
          >
            <span>{tab.label}</span>
            {tab.subtitle && (
              <span
                className="block text-[10px] mt-0.5"
                style={{ fontFamily: 'var(--mono)', opacity: 0.7 }}
              >
                {tab.subtitle}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Page selector — visible when a domain is selected */}
      {selectedDomain && pages.length > 0 && (
        <div
          className="rounded-xl p-4 space-y-3"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold tracking-wider" style={{ color: 'var(--text-muted)' }}>
              FILTRAR POR PÁGINA
            </h3>
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

          {pages.length > 5 && (
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
          )}

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
      )}

      {/* Source filter — visible when a domain is selected and sources exist */}
      {selectedDomain && sources.length > 0 && (
        <div
          className="rounded-xl p-4 space-y-3"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold tracking-wider" style={{ color: 'var(--text-muted)' }}>
              FILTRAR POR ORIGEM
            </h3>
            {selectedSource && (
              <button
                onClick={() => setSelectedSource('')}
                className="text-xs px-2 py-1 rounded cursor-pointer transition-colors"
                style={{
                  color: 'var(--teal)',
                  backgroundColor: 'var(--teal-dim)',
                  fontFamily: 'var(--mono)',
                }}
              >
                Limpar filtro
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedSource('')}
              className="px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
              style={{
                fontFamily: 'var(--mono)',
                fontSize: '11px',
                backgroundColor: !selectedSource ? 'var(--teal-dim)' : 'transparent',
                border: !selectedSource ? '1px solid var(--teal)' : '1px solid var(--border)',
                color: !selectedSource ? 'var(--teal)' : 'var(--text-muted)',
              }}
            >
              Todas
            </button>
            {sources.map((s) => (
              <button
                key={s.source}
                onClick={() => setSelectedSource(s.source)}
                className="px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: '11px',
                  backgroundColor: selectedSource === s.source ? 'var(--teal-dim)' : 'transparent',
                  border: selectedSource === s.source ? '1px solid var(--teal)' : '1px solid var(--border)',
                  color: selectedSource === s.source ? 'var(--teal)' : 'var(--text-muted)',
                }}
              >
                {s.source}
                <span
                  className="px-1.5 py-0.5 rounded text-[10px]"
                  style={{
                    backgroundColor: selectedSource === s.source ? 'rgba(20, 184, 166, 0.2)' : 'var(--surface-alt)',
                    color: selectedSource === s.source ? 'var(--teal)' : 'var(--text-dim)',
                  }}
                >
                  {s.leads}
                </span>
              </button>
            ))}
          </div>

          {selectedSource && (
            <div className="text-xs" style={{ color: 'var(--text-dim)', fontFamily: 'var(--mono)' }}>
              Filtrando: {selectedSource}
            </div>
          )}
        </div>
      )}

      {/* A/B Variant comparison — visible when LP domain has variants */}
      {selectedDomain === 'lp.petbee.com.br' && variants.length > 0 && (
        <div className="space-y-3">
          {/* Comparison summary card */}
          <div
            className="rounded-xl p-4 space-y-4"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold tracking-wider" style={{ color: 'var(--text-muted)' }}>
                TESTE A/B {selectedPage ? `— ${selectedPage}` : ''}
              </h3>
              {selectedVariant && (
                <button
                  onClick={() => setSelectedVariant('')}
                  className="text-xs px-2 py-1 rounded cursor-pointer transition-colors"
                  style={{
                    color: 'var(--purple)',
                    backgroundColor: 'var(--purple-dim)',
                    fontFamily: 'var(--mono)',
                  }}
                >
                  Ver todas
                </button>
              )}
            </div>

            {/* Variant comparison grid */}
            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${variants.length}, 1fr)` }}>
              {variants.map((v) => {
                const isWinner = variants.length > 1 &&
                  v.convRate === Math.max(...variants.map((x) => x.convRate)) &&
                  v.convRate > 0;
                const isSelected = selectedVariant === v.variant;
                const label = v.variant.includes(':') ? v.variant.split(':')[1] : v.variant;
                const slug = v.variant.includes(':') ? v.variant.split(':')[0] : '';

                return (
                  <button
                    key={v.variant}
                    onClick={() => setSelectedVariant(isSelected ? '' : v.variant)}
                    className="rounded-lg p-3 text-left transition-all cursor-pointer"
                    style={{
                      backgroundColor: isSelected ? 'var(--purple-dim)' : 'var(--surface-alt)',
                      border: isSelected
                        ? '1px solid var(--purple)'
                        : isWinner
                          ? '1px solid var(--accent)'
                          : '1px solid var(--border)',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="text-sm font-semibold"
                        style={{ color: isSelected ? 'var(--purple)' : 'var(--text)' }}
                      >
                        Variante {label}
                      </span>
                      {isWinner && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                          style={{
                            backgroundColor: 'var(--accent-dim)',
                            color: 'var(--accent)',
                          }}
                        >
                          WINNER
                        </span>
                      )}
                    </div>
                    {slug && (
                      <div
                        className="text-[10px] mb-2"
                        style={{ color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}
                      >
                        {slug}
                      </div>
                    )}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span style={{ color: 'var(--text-dim)' }}>Pageviews</span>
                        <span style={{ fontFamily: 'var(--mono)', color: 'var(--text)' }}>
                          {formatNumber(v.pageviews)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span style={{ color: 'var(--text-dim)' }}>Leads</span>
                        <span style={{ fontFamily: 'var(--mono)', color: 'var(--accent)' }}>
                          {formatNumber(v.leads)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span style={{ color: 'var(--text-dim)' }}>Conversão</span>
                        <span
                          style={{
                            fontFamily: 'var(--mono)',
                            color: isWinner ? 'var(--accent)' : 'var(--text)',
                            fontWeight: isWinner ? 600 : 400,
                          }}
                        >
                          {formatPercent(v.convRate)}
                        </span>
                      </div>
                      {/* Delta vs first variant */}
                      {variants.length > 1 && variants[0].variant !== v.variant && variants[0].convRate > 0 && (
                        <div className="flex justify-between text-xs pt-1" style={{ borderTop: '1px solid var(--border)' }}>
                          <span style={{ color: 'var(--text-muted)' }}>vs {variants[0].variant.includes(':') ? variants[0].variant.split(':')[1] : variants[0].variant}</span>
                          <span
                            style={{
                              fontFamily: 'var(--mono)',
                              color: v.convRate > variants[0].convRate ? 'var(--accent)' : 'var(--red)',
                            }}
                          >
                            {v.convRate > variants[0].convRate ? '↑' : '↓'}{' '}
                            {formatPercent(Math.abs(((v.convRate - variants[0].convRate) / variants[0].convRate) * 100))}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Carregando...</div>
      )}

      {data && !loading && (
        <>
          {/* Multiple funnels (website) */}
          {data.funnels && data.funnels.length > 0 ? (
            data.funnels.map((funnel, fi) => (
              <div key={funnel.title} className="space-y-4" style={{ animationDelay: `${fi * 0.08}s` }}>
                <h2
                  className="text-sm font-semibold tracking-wide fade-up"
                  style={{ color: 'var(--text-dim)' }}
                >
                  {funnel.title}
                </h2>
                <FunnelChart
                  steps={funnel.steps}
                  stepConversions={funnel.stepConversions}
                  conversionTarget="Leads"
                />
              </div>
            ))
          ) : (
            /* Single funnel (LP / Todas) */
            <FunnelChart
              steps={data.steps}
              stepConversions={data.stepConversions}
              conversionTarget={selectedDomain ? 'Leads' : undefined}
            />
          )}

          {/* Drop-off table — uses funnels data or single funnel */}
          {(() => {
            const allSteps = data.funnels
              ? data.funnels.flatMap((f) => f.steps)
              : data.steps;
            const allConversions = data.funnels
              ? data.funnels.flatMap((f) => f.stepConversions)
              : data.stepConversions;

            if (allConversions.length === 0) return null;

            return (
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
                      {allConversions.map((conv, i) => {
                        const fromStep = allSteps.find((s) => s.name === conv.from);
                        const toStep = allSteps.find((s) => s.name === conv.to);
                        const lost = (fromStep?.count ?? 0) - (toStep?.count ?? 0);
                        return (
                          <tr
                            key={`${conv.from}-${conv.to}-${i}`}
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
            );
          })()}
        </>
      )}
    </div>
  );
}
