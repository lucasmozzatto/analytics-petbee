import type { FunnelStep, StepConversion } from '../types';
import { formatNumber, formatPercent } from '../lib/format';

interface FunnelChartProps {
  steps: FunnelStep[];
  stepConversions: StepConversion[];
}

const STEP_COLORS = [
  'var(--accent)',
  'var(--teal)',
  'var(--blue)',
  'var(--purple)',
  'var(--amber)',
  'var(--orange)',
];

export default function FunnelChart({ steps, stepConversions }: FunnelChartProps) {
  const maxCount = Math.max(...steps.map((s) => s.count), 1);

  return (
    <div
      className="rounded-xl p-5 fade-up"
      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <h3
        className="text-xs font-semibold tracking-wider mb-6"
        style={{ color: 'var(--text-muted)' }}
      >
        FUNIL DE CONVERSÃO
      </h3>

      <div className="flex flex-col gap-2">
        {steps.map((step, i) => {
          const widthPct = Math.max((step.count / maxCount) * 100, 4);
          const color = STEP_COLORS[i % STEP_COLORS.length];
          const conversion = stepConversions[i];

          return (
            <div key={step.event}>
              <div
                className="flex items-center gap-4 fade-up"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                {/* Label */}
                <div className="w-28 shrink-0 text-right">
                  <div className="text-sm" style={{ color: 'var(--text)' }}>{step.name}</div>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
                    {step.event}
                  </div>
                </div>

                {/* Bar */}
                <div className="flex-1">
                  <div
                    className="h-9 rounded-lg flex items-center px-3 gap-2 transition-all"
                    style={{
                      width: `${widthPct}%`,
                      backgroundColor: color,
                      opacity: 0.85,
                      minWidth: '80px',
                    }}
                  >
                    <span className="text-sm font-bold text-white" style={{ fontFamily: 'var(--mono)' }}>
                      {formatNumber(step.count)}
                    </span>
                  </div>
                </div>

                {/* Rate */}
                <div className="w-16 text-right">
                  <span className="text-xs" style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)' }}>
                    {formatPercent(step.rate)}
                  </span>
                </div>
              </div>

              {/* Step-to-step conversion */}
              {conversion && (
                <div className="flex items-center gap-4 py-1">
                  <div className="w-28" />
                  <div className="flex-1 flex items-center gap-2 pl-4">
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>↓</span>
                    <span className="text-[10px]" style={{ fontFamily: 'var(--mono)', color: 'var(--text-muted)' }}>
                      {formatPercent(conversion.rate)} conversão
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
