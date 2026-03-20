import type { OnboardingStep } from '../types';
import { formatNumber, formatPercent } from '../lib/format';
import {
  getStepConfig,
  getStepLabel,
  PHASE_DISPLAY,
  type OnboardingPhase,
} from '../lib/onboarding-config';

interface OnboardingChartProps {
  steps: OnboardingStep[];
}

/** Group steps by phase, preserving order and filtering skipped steps. */
function groupByPhase(steps: OnboardingStep[]) {
  const groups: { phase: OnboardingPhase; steps: OnboardingStep[] }[] = [];
  let currentPhase: OnboardingPhase | null = null;

  for (const step of steps) {
    const config = getStepConfig(step.stepNumber);
    if (config?.skipped) continue;

    const phase = config?.phase ?? 'entrada';
    if (phase !== currentPhase) {
      groups.push({ phase, steps: [] });
      currentPhase = phase;
    }
    groups[groups.length - 1].steps.push(step);
  }

  return groups;
}

export default function OnboardingChart({ steps }: OnboardingChartProps) {
  const maxUsers = Math.max(...steps.map((s) => s.users), 1);
  const groups = groupByPhase(steps);

  return (
    <div
      className="rounded-xl p-5 fade-up"
      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      {groups.map((group, gi) => {
        const phaseDisplay = PHASE_DISPLAY[group.phase];
        return (
          <div key={group.phase}>
            {gi > 0 && (
              <div className="my-4" style={{ borderBottom: '1px solid var(--border)' }} />
            )}

            <h3
              className="text-xs font-semibold tracking-wider mb-3"
              style={{ color: phaseDisplay.color, letterSpacing: '0.05em' }}
            >
              {phaseDisplay.label}
            </h3>

            <div className="flex flex-col gap-0.5">
              {group.steps.map((step, i) => {
                const config = getStepConfig(step.stepNumber);
                const label = getStepLabel(step.stepNumber, step.stepName);
                const barWidth = Math.max((step.users / maxUsers) * 100, 4);
                const opacity = 0.3 + (step.rate / 100) * 0.7;
                const hasFriction = step.stepRate < 70 && step.stepNumber > 1;

                const prevIdx = steps.findIndex((s) => s.stepNumber === step.stepNumber) - 1;
                const prevStep = prevIdx >= 0 ? steps[prevIdx] : null;
                const prevConfig = prevStep ? getStepConfig(prevStep.stepNumber) : null;
                const flowChanged = prevConfig && config && prevConfig.flow !== config.flow
                  && prevConfig.flow !== 'shared' && config.flow !== 'shared';
                const dropPct =
                  prevStep && prevStep.users > 0 && !flowChanged
                    ? ((prevStep.users - step.users) / prevStep.users) * 100
                    : 0;

                const hasKeyEvent = config?.keyEvents && config.keyEvents.length > 0;

                return (
                  <div
                    key={step.stepNumber}
                    className="flex items-center gap-3 fade-up"
                    style={{
                      height: '28px',
                      animationDelay: `${(gi * 6 + i) * 0.03}s`,
                      borderLeft: hasFriction
                        ? '3px solid var(--red)'
                        : '3px solid transparent',
                      paddingLeft: '8px',
                    }}
                  >
                    {/* Step label */}
                    <div
                      className="flex items-center gap-1.5 shrink-0"
                      style={{ width: '220px', minWidth: '220px' }}
                    >
                      <span
                        className="text-[10px] w-5 text-center shrink-0"
                        style={{ fontFamily: 'var(--mono)', color: 'var(--text-muted)' }}
                      >
                        {step.stepNumber}
                      </span>

                      {hasKeyEvent && (
                        <span
                          className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: 'var(--amber)' }}
                          title={`Eventos: ${config!.keyEvents!.join(', ')}`}
                        />
                      )}

                      <span
                        className="text-xs truncate"
                        style={{ color: 'var(--text-dim)' }}
                        title={label}
                      >
                        {label}
                      </span>

                      {config?.flow === 'new' && (
                        <span
                          className="text-[9px] px-1 py-px rounded shrink-0"
                          style={{
                            backgroundColor: 'var(--accent-dim)',
                            color: 'var(--accent)',
                            fontFamily: 'var(--mono)',
                          }}
                        >
                          NOVO
                        </span>
                      )}
                      {config?.flow === 'existing' && (
                        <span
                          className="text-[9px] px-1 py-px rounded shrink-0"
                          style={{
                            backgroundColor: 'var(--blue-dim)',
                            color: 'var(--blue)',
                            fontFamily: 'var(--mono)',
                          }}
                        >
                          EXISTENTE
                        </span>
                      )}
                    </div>

                    {/* Bar */}
                    <div
                      className="flex-1 relative h-4 rounded-sm overflow-hidden"
                      style={{ backgroundColor: 'var(--surface-alt)' }}
                    >
                      <div
                        className="h-full rounded-sm transition-all duration-300"
                        style={{
                          width: `${barWidth}%`,
                          backgroundColor: phaseDisplay.color,
                          opacity,
                        }}
                      />
                    </div>

                    {/* Users */}
                    <span
                      className="text-xs shrink-0 text-right"
                      style={{ fontFamily: 'var(--mono)', color: 'var(--text)', width: '56px' }}
                    >
                      {formatNumber(step.users)}
                    </span>

                    {/* Rate vs step 1 */}
                    <span
                      className="text-[10px] shrink-0 text-right"
                      style={{
                        fontFamily: 'var(--mono)',
                        color: phaseDisplay.color,
                        width: '48px',
                      }}
                    >
                      {formatPercent(step.rate, 1)}
                    </span>

                    {/* Drop indicator */}
                    <span
                      className="text-[10px] shrink-0 text-right"
                      style={{
                        fontFamily: 'var(--mono)',
                        color: dropPct > 30 ? 'var(--red)' : 'var(--text-muted)',
                        width: '48px',
                      }}
                    >
                      {step.stepNumber > 1 && dropPct > 0
                        ? `↓${formatPercent(dropPct, 0)}`
                        : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div
        className="flex items-center gap-5 mt-5 pt-3 flex-wrap"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: 'var(--amber)' }}
          />
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            Evento ecommerce
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="text-[9px] px-1 py-px rounded"
            style={{
              backgroundColor: 'var(--accent-dim)',
              color: 'var(--accent)',
              fontFamily: 'var(--mono)',
            }}
          >
            NOVO
          </span>
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            Apenas cliente novo
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="text-[9px] px-1 py-px rounded"
            style={{
              backgroundColor: 'var(--blue-dim)',
              color: 'var(--blue)',
              fontFamily: 'var(--mono)',
            }}
          >
            EXISTENTE
          </span>
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            Apenas cliente existente
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block w-3 h-0 shrink-0"
            style={{ borderTop: '3px solid var(--red)' }}
          />
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            Fricção (&lt;70% retenção)
          </span>
        </div>
      </div>
    </div>
  );
}
