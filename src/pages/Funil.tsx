import { useEffect, useState } from 'react';
import { useTimeWindow } from '../hooks/useGA4Data';
import { getFunil } from '../lib/api';
import type { FunnelData } from '../types';
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
  const { window, setWindow, startDate, endDate, compare, setCompare } = useTimeWindow();
  const [data, setData] = useState<FunnelData | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getFunil(startDate, endDate, compare, undefined, selectedDomain || undefined)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [startDate, endDate, compare, selectedDomain]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Funil</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Jornada do visitante no site e landing pages
        </p>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <TimeWindowPicker value={window} onChange={setWindow} startDate={startDate} endDate={endDate} />
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
    </div>
  );
}
