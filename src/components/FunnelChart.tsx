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
  const totalSteps = steps.length;

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

      <div className="flex flex-col items-center gap-0">
        {steps.map((step, i) => {
          const widthPct = Math.max((step.count / maxCount) * 100, 20);
          const nextWidthPct = i < totalSteps - 1
            ? Math.max((steps[i + 1].count / maxCount) * 100, 20)
            : widthPct * 0.8;
          const color = STEP_COLORS[i % STEP_COLORS.length];
          const conversion = stepConversions[i];

          return (
            <div key={step.event} className="w-full flex flex-col items-center">
              {/* Funnel step - trapezoid shape */}
              <div
                className="relative flex items-center justify-center fade-up"
                style={{
                  animationDelay: `${i * 0.08}s`,
                  width: '100%',
                  maxWidth: '700px',
                }}
              >
                <div
                  className="relative flex items-center justify-between px-6 py-4"
                  style={{
                    width: `${widthPct}%`,
                    minWidth: '280px',
                    background: color,
                    opacity: 0.9,
                    clipPath: `polygon(0 0, 100% 0, ${50 + (nextWidthPct / widthPct) * 50}% 100%, ${50 - (nextWidthPct / widthPct) * 50}% 100%)`,
                    minHeight: '56px',
                  }}
                >
                  {/* Left: Step name */}
                  <div className="z-10">
                    <div className="text-sm font-semibold text-white">{step.name}</div>
                    <div className="text-[10px] text-white/60" style={{ fontFamily: 'var(--mono)' }}>
                      {step.event}
                    </div>
                  </div>

                  {/* Right: Values */}
                  <div className="z-10 text-right">
                    <div className="text-lg font-bold text-white" style={{ fontFamily: 'var(--mono)' }}>
                      {formatNumber(step.count)}
                    </div>
                    <div className="text-[10px] text-white/70" style={{ fontFamily: 'var(--mono)' }}>
                      {formatPercent(step.rate)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step-to-step conversion arrow */}
              {conversion && (
                <div
                  className="flex items-center justify-center gap-2 py-1"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <span className="text-[10px]">↓</span>
                  <span className="text-[10px]" style={{ fontFamily: 'var(--mono)' }}>
                    {formatPercent(conversion.rate)}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
