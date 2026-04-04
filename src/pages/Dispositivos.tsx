import { useEffect, useState } from 'react';
import { useTimeWindow } from '../hooks/useGA4Data';
import { getDispositivos } from '../lib/api';
import { formatNumber, formatPercent, formatDuration } from '../lib/format';
import type { DeviceRow } from '../types';
import TimeWindowPicker from '../components/TimeWindowPicker';

const DEVICE_COLORS: Record<string, string> = {
  mobile: 'var(--blue)',
  desktop: 'var(--accent)',
  tablet: 'var(--purple)',
};

const DEVICE_LABELS: Record<string, string> = {
  mobile: 'Mobile',
  desktop: 'Desktop',
  tablet: 'Tablet',
};

function DeviceCard({ device, delay }: { device: DeviceRow; delay: number }) {
  const color = DEVICE_COLORS[device.deviceCategory] ?? 'var(--text-dim)';
  const label = DEVICE_LABELS[device.deviceCategory] ?? device.deviceCategory;

  return (
    <div
      className="rounded-xl p-5 fade-up"
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        animationDelay: `${delay}s`,
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="text-sm font-semibold" style={{ color }}>
          {label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div
            className="text-[10px] font-semibold tracking-widest mb-1"
            style={{ color: 'var(--text-muted)' }}
          >
            SESSOES
          </div>
          <div
            className="text-xl font-bold"
            style={{ fontFamily: 'var(--mono)', color: 'var(--text)' }}
          >
            {formatNumber(device.sessions)}
          </div>
        </div>
        <div>
          <div
            className="text-[10px] font-semibold tracking-widest mb-1"
            style={{ color: 'var(--text-muted)' }}
          >
            USUARIOS
          </div>
          <div
            className="text-xl font-bold"
            style={{ fontFamily: 'var(--mono)', color: 'var(--text)' }}
          >
            {formatNumber(device.users)}
          </div>
        </div>
        <div>
          <div
            className="text-[10px] font-semibold tracking-widest mb-1"
            style={{ color: 'var(--text-muted)' }}
          >
            BOUNCE RATE
          </div>
          <div
            className="text-lg font-bold"
            style={{ fontFamily: 'var(--mono)', color: 'var(--red)' }}
          >
            {formatPercent(device.bounceRate)}
          </div>
        </div>
        <div>
          <div
            className="text-[10px] font-semibold tracking-widest mb-1"
            style={{ color: 'var(--text-muted)' }}
          >
            DURACAO MEDIA
          </div>
          <div
            className="text-lg font-bold"
            style={{ fontFamily: 'var(--mono)', color: 'var(--blue)' }}
          >
            {formatDuration(device.avgSessionDuration)}
          </div>
        </div>
        <div>
          <div
            className="text-[10px] font-semibold tracking-widest mb-1"
            style={{ color: 'var(--text-muted)' }}
          >
            LEADS
          </div>
          <div
            className="text-lg font-bold"
            style={{ fontFamily: 'var(--mono)', color: 'var(--accent)' }}
          >
            {formatNumber(device.leads)}
          </div>
        </div>
        <div>
          <div
            className="text-[10px] font-semibold tracking-widest mb-1"
            style={{ color: 'var(--text-muted)' }}
          >
            VENDAS
          </div>
          <div
            className="text-lg font-bold"
            style={{ fontFamily: 'var(--mono)', color: 'var(--teal)' }}
          >
            {formatNumber(device.contracts)}
          </div>
        </div>
      </div>

      <div
        className="mt-4 pt-3 flex items-center justify-between text-xs"
        style={{
          borderTop: '1px solid var(--border)',
          fontFamily: 'var(--mono)',
          color: 'var(--text-dim)',
        }}
      >
        <span>Conv. Lead: {formatPercent(device.convRateLead)}</span>
        <span>Conv. Venda: {formatPercent(device.convRateContract)}</span>
      </div>
    </div>
  );
}

export default function Dispositivos() {
  const { window, setWindow, startDate, endDate, customStart, customEnd, setCustomRange } = useTimeWindow();
  const [data, setData] = useState<DeviceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getDispositivos(startDate, endDate)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Dispositivos</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Performance por tipo de dispositivo
        </p>
      </div>

      <TimeWindowPicker
        value={window}
        onChange={setWindow}
        startDate={startDate}
        endDate={endDate}
        customStart={customStart}
        customEnd={customEnd}
        onCustomRange={setCustomRange}
      />

      {loading && (
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Carregando...</div>
      )}

      {!loading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.map((device, i) => (
              <DeviceCard key={device.deviceCategory} device={device} delay={i * 0.04} />
            ))}
          </div>

          {/* Comparative table */}
          {data.length > 0 && (
            <div
              className="rounded-xl overflow-hidden fade-up"
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                animationDelay: '0.16s',
              }}
            >
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Dispositivo', 'Sessoes', 'Usuarios', 'Bounce Rate', 'Duracao', 'Leads', 'Vendas', 'Conv. Lead', 'Conv. Venda'].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {h.toUpperCase()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((d, i) => (
                    <tr
                      key={d.deviceCategory}
                      className="fade-up"
                      style={{
                        borderBottom: i < data.length - 1 ? '1px solid var(--border)' : undefined,
                        animationDelay: `${0.2 + i * 0.04}s`,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-alt)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td className="px-4 py-3 text-sm" style={{ color: DEVICE_COLORS[d.deviceCategory] ?? 'var(--text)' }}>
                        {DEVICE_LABELS[d.deviceCategory] ?? d.deviceCategory}
                      </td>
                      <td className="px-4 py-3 text-sm text-right" style={{ fontFamily: 'var(--mono)', color: 'var(--text)' }}>
                        {formatNumber(d.sessions)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right" style={{ fontFamily: 'var(--mono)', color: 'var(--text)' }}>
                        {formatNumber(d.users)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right" style={{ fontFamily: 'var(--mono)', color: d.bounceRate > 60 ? 'var(--red)' : d.bounceRate > 40 ? 'var(--amber)' : 'var(--accent)' }}>
                        {formatPercent(d.bounceRate)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right" style={{ fontFamily: 'var(--mono)', color: 'var(--text)' }}>
                        {formatDuration(d.avgSessionDuration)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right" style={{ fontFamily: 'var(--mono)', color: 'var(--accent)' }}>
                        {formatNumber(d.leads)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right" style={{ fontFamily: 'var(--mono)', color: 'var(--teal)' }}>
                        {formatNumber(d.contracts)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right" style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)' }}>
                        {formatPercent(d.convRateLead)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right" style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)' }}>
                        {formatPercent(d.convRateContract)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
