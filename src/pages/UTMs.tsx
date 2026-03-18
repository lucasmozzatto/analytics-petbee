import { useEffect, useState } from 'react';
import { useTimeWindow } from '../hooks/useGA4Data';
import { getUTMs } from '../lib/api';
import type { UTMRow, UTMDimension } from '../types';
import TimeWindowPicker from '../components/TimeWindowPicker';
import UTMTable from '../components/UTMTable';

const TABS: { label: string; value: UTMDimension }[] = [
  { label: 'Campanha', value: 'campaign' },
  { label: 'Source', value: 'source' },
  { label: 'Medium', value: 'medium' },
  { label: 'Content', value: 'content' },
  { label: 'Term', value: 'term' },
];

const DIMENSION_LABELS: Record<UTMDimension, string> = {
  campaign: 'Campanha',
  source: 'Source',
  medium: 'Medium',
  content: 'Content',
  term: 'Term',
};

export default function UTMs() {
  const { window, setWindow, startDate, endDate } = useTimeWindow();
  const [dimension, setDimension] = useState<UTMDimension>('campaign');
  const [data, setData] = useState<UTMRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getUTMs(startDate, endDate, dimension)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [startDate, endDate, dimension]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>UTMs</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Análise por parâmetros UTM</p>
      </div>

      <TimeWindowPicker value={window} onChange={setWindow} />

      <div className="flex gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setDimension(tab.value)}
            className="px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
            style={{
              fontFamily: 'var(--mono)',
              fontSize: '12px',
              backgroundColor: dimension === tab.value ? 'var(--surface-alt)' : 'transparent',
              border: dimension === tab.value ? '1px solid var(--border-light)' : '1px solid transparent',
              color: dimension === tab.value ? 'var(--text)' : 'var(--text-muted)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Carregando...</div>
      ) : (
        <UTMTable data={data} dimensionLabel={DIMENSION_LABELS[dimension]} />
      )}
    </div>
  );
}
