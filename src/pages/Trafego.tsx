import { useEffect, useState } from 'react';
import { useTimeWindow } from '../hooks/useGA4Data';
import { getTrafego } from '../lib/api';
import type { TrafegoResponse } from '../types';
import TimeWindowPicker from '../components/TimeWindowPicker';
import CompareToggle from '../components/CompareToggle';
import ChannelTable from '../components/ChannelTable';
import ChannelStackedAreaChart from '../components/ChannelStackedAreaChart';
import SourceMediumTable from '../components/SourceMediumTable';

export default function Trafego() {
  const { window, setWindow, startDate, endDate, compare, setCompare, customStart, customEnd, setCustomRange } = useTimeWindow();
  const [data, setData] = useState<TrafegoResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getTrafego(startDate, endDate, compare)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [startDate, endDate, compare]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Tráfego</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Sessões por canal e fonte/mídia</p>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <TimeWindowPicker value={window} onChange={setWindow} startDate={startDate} endDate={endDate} customStart={customStart} customEnd={customEnd} onCustomRange={setCustomRange} />
        <CompareToggle enabled={compare} onChange={setCompare} />
      </div>

      {loading && (
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Carregando...</div>
      )}

      {data && !loading && (
        <>
          <ChannelStackedAreaChart data={data.byChannelDaily} />
          <ChannelTable
            data={data.byChannel}
            previous={compare ? data.previous?.byChannel : undefined}
          />
          <SourceMediumTable data={data.bySourceMedium} />
        </>
      )}
    </div>
  );
}
