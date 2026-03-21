import type { FunnelStep, StepConversion } from '../types';
import { formatNumber, formatPercent } from '../lib/format';

interface FunnelChartProps {
  steps: FunnelStep[];
  stepConversions: StepConversion[];
  conversionTarget?: string;
}

const STEP_COLORS = [
  'var(--accent)',
  'var(--teal)',
  'var(--blue)',
  'var(--purple)',
  'var(--amber)',
  'var(--orange)',
];

export default function FunnelChart({ steps, stepConversions, conversionTarget }: FunnelChartProps) {
  const maxCount = Math.max(...steps.map((s) => s.count), 1);
  const totalSteps = steps.length;

  const firstStep = steps[0];
  const targetStep = conversionTarget
    ? steps.find((s) => s.name === conversionTarget) ?? (steps.length > 1 ? steps[steps.length - 1] : null)
    : (steps.length > 1 ? steps[steps.length - 1] : null);
  const overallRate = firstStep && targetStep && firstStep.count > 0
    ? (targetStep.count / firstStep.count) * 100
    : 0;

  // Find biggest drop
  const biggestDrop = stepConversions.reduce<{ from: string; to: string; lost: number; rate: number }>(
    (max, conv) => {
      const fromStep = steps.find((s) => s.name === conv.from);
      const toStep = steps.find((s) => s.name === conv.to);
      const lost = (fromStep?.count ?? 0) - (toStep?.count ?? 0);
      return lost > max.lost ? { from: conv.from, to: conv.to, lost, rate: conv.rate } : max;
    },
    { from: '', to: '', lost: 0, rate: 0 }
  );

  return (
    <div
      className="rounded-xl p-5 fade-up"
      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      {/* KPI Summary */}
      {steps.length > 1 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--surface-alt)' }}>
            <div className="text-[10px] font-medium tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
              ENTRADA
            </div>
            <div className="text-xl font-bold" style={{ fontFamily: 'var(--mono)', color: 'var(--accent)' }}>
              {formatNumber(firstStep.count)}
            </div>
            <div className="text-[10px] mt-0.5" style={{ fontFamily: 'var(--mono)', color: 'var(--text-muted)' }}>
              {firstStep.name}
            </div>
          </div>
          <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--surface-alt)' }}>
            <div className="text-[10px] font-medium tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
              {conversionTarget ? conversionTarget.toUpperCase() : 'SAÍDA'}
            </div>
            <div className="text-xl font-bold" style={{ fontFamily: 'var(--mono)', color: 'var(--teal)' }}>
              {targetStep ? formatNumber(targetStep.count) : '—'}
            </div>
            <div className="text-[10px] mt-0.5" style={{ fontFamily: 'var(--mono)', color: 'var(--text-muted)' }}>
              {targetStep?.name ?? '—'}
            </div>
          </div>
          <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--surface-alt)' }}>
            <div className="text-[10px] font-medium tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
              CONVERSÃO TOTAL
            </div>
            <div className="text-xl font-bold" style={{ fontFamily: 'var(--mono)', color: 'var(--blue)' }}>
              {formatPercent(overallRate, 2)}
            </div>
            <div className="text-[10px] mt-0.5" style={{ fontFamily: 'var(--mono)', color: 'var(--text-muted)' }}>
              {firstStep.name} → {targetStep?.name ?? '—'}
            </div>
          </div>
          <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--surface-alt)' }}>
            <div className="text-[10px] font-medium tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
              MAIOR PERDA
            </div>
            <div className="text-xl font-bold" style={{ fontFamily: 'var(--mono)', color: 'var(--red)' }}>
              {biggestDrop.lost > 0 ? `-${formatNumber(biggestDrop.lost)}` : '—'}
            </div>
            <div className="text-[10px] mt-0.5" style={{ fontFamily: 'var(--mono)', color: 'var(--text-muted)' }}>
              {biggestDrop.lost > 0 ? `${biggestDrop.from} → ${biggestDrop.to}` : '—'}
            </div>
          </div>
        </div>
      )}

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

          // Calculate lost between this step and next
          const nextStep = i < totalSteps - 1 ? steps[i + 1] : null;
          const lost = nextStep ? step.count - nextStep.count : 0;

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
                  className="relative flex items-center justify-center py-4"
                  style={{
                    width: `${widthPct}%`,
                    minWidth: '280px',
                    background: color,
                    opacity: 0.9,
                    clipPath: `polygon(0 0, 100% 0, ${50 + (nextWidthPct / widthPct) * 50}% 100%, ${50 - (nextWidthPct / widthPct) * 50}% 100%)`,
                    minHeight: '56px',
                  }}
                >
                  <div className="z-10 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-sm font-semibold text-white">{step.name}</span>
                      <span className="text-lg font-bold text-white" style={{ fontFamily: 'var(--mono)' }}>
                        {formatNumber(step.count)}
                      </span>
                    </div>
                    <div className="text-[10px] text-white/60" style={{ fontFamily: 'var(--mono)' }}>
                      {step.event} · {formatPercent(step.rate)} do total
                    </div>
                  </div>
                </div>
              </div>

              {/* Step-to-step conversion info */}
              {conversion && (
                <div
                  className="flex items-center justify-center gap-4 py-2"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <span className="text-xs">↓</span>
                  <span
                    className="text-xs font-medium"
                    style={{ fontFamily: 'var(--mono)', color: 'var(--accent)' }}
                  >
                    {formatPercent(conversion.rate, 1)}
                  </span>
                  <span
                    className="text-[10px]"
                    style={{ fontFamily: 'var(--mono)', color: 'var(--red)' }}
                  >
                    -{formatNumber(lost)}
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
