import { useEffect, useState } from "react";
import { useTimeWindow } from "../hooks/useGA4Data";
import { getOnboarding } from "../lib/api";
import type { OnboardingFunnelData } from "../types";
import TimeWindowPicker from "../components/TimeWindowPicker";
import CompareToggle from "../components/CompareToggle";
import OnboardingChart from "../components/OnboardingChart";
import DeltaBadge from "../components/DeltaBadge";
import { formatNumber, formatPercent } from "../lib/format";
import {
  getStepConfig,
  getStepLabel,
  PHASE_DISPLAY,
} from "../lib/onboarding-config";

export default function Onboarding() {
  const {
    window,
    setWindow,
    startDate,
    endDate,
    compare,
    setCompare,
    customStart,
    customEnd,
    setCustomRange,
  } = useTimeWindow("7d", "2026-03-21");
  const [data, setData] = useState<OnboardingFunnelData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getOnboarding(startDate, endDate, compare)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [startDate, endDate, compare]);

  const started = data?.totalStep1Users ?? 0;
  const lastStep = data?.steps.length
    ? data.steps[data.steps.length - 1]
    : null;
  const completed = lastStep?.users ?? 0;
  const completionRate = started > 0 ? (completed / started) * 100 : 0;

  // Find step with highest drop (most users lost)
  const biggestDrop = data?.steps.reduce<{
    stepName: string;
    lost: number;
    stepNumber: number;
  }>(
    (max, step, i) => {
      if (i === 0) return max;
      const prev = data.steps[i - 1];
      const lost = prev.users - step.users;
      return lost > max.lost
        ? { stepName: step.stepName, lost, stepNumber: step.stepNumber }
        : max;
    },
    { stepName: "", lost: 0, stepNumber: 0 },
  );

  // Previous period data
  const prevStarted = data?.previous?.totalStep1Users ?? 0;
  const prevLastStep = data?.previous?.steps.length
    ? data.previous.steps[data.previous.steps.length - 1]
    : null;
  const prevCompleted = prevLastStep?.users ?? 0;
  const prevCompletionRate =
    prevStarted > 0 ? (prevCompleted / prevStarted) * 100 : 0;

  const prevBiggestDrop = data?.previous?.steps.reduce<{ lost: number }>(
    (max, step, i) => {
      if (i === 0 || !data.previous) return max;
      const prev = data.previous.steps[i - 1];
      const lost = prev.users - step.users;
      return lost > max.lost ? { lost } : max;
    },
    { lost: 0 },
  );

  const kpiCards = [
    {
      label: "INICIARAM",
      value: formatNumber(started),
      color: "var(--accent)",
      current: started,
      previous: compare ? prevStarted : undefined,
    },
    {
      label: "COMPLETARAM",
      value: formatNumber(completed),
      color: "var(--teal)",
      current: completed,
      previous: compare ? prevCompleted : undefined,
    },
    {
      label: "TAXA CONCLUSÃO",
      value: formatPercent(completionRate),
      color: "var(--blue)",
      current: completionRate,
      previous: compare ? prevCompletionRate : undefined,
    },
    {
      label: "MAIOR PERDA",
      value:
        biggestDrop && biggestDrop.lost > 0
          ? getStepLabel(biggestDrop.stepNumber, biggestDrop.stepName)
          : "—",
      subtitle:
        biggestDrop && biggestDrop.lost > 0
          ? `-${formatNumber(biggestDrop.lost)} usuários`
          : undefined,
      color: "var(--red)",
      current: biggestDrop?.lost ?? 0,
      previous: compare ? (prevBiggestDrop?.lost ?? 0) : undefined,
      invert: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
          Onboarding
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Progressão dos leads no fluxo de contratação
        </p>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <TimeWindowPicker
          value={window}
          onChange={setWindow}
          startDate={startDate}
          endDate={endDate}
          customStart={customStart}
          customEnd={customEnd}
          onCustomRange={setCustomRange}
        />
        <CompareToggle enabled={compare} onChange={setCompare} />
      </div>

      {loading && (
        <div className="text-sm" style={{ color: "var(--text-muted)" }}>
          Carregando...
        </div>
      )}

      {data && !loading && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiCards.map((card, i) => (
              <div
                key={card.label}
                className="rounded-xl p-4 fade-up"
                style={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--border)",
                  animationDelay: `${i * 0.04}s`,
                }}
              >
                <div
                  className="text-xs font-medium tracking-wider mb-2"
                  style={{
                    color: "var(--text-muted)",
                    letterSpacing: "0.05em",
                  }}
                >
                  {card.label}
                </div>
                <div className="flex items-end gap-2">
                  <span
                    className="text-2xl font-bold"
                    style={{ fontFamily: "var(--mono)", color: card.color }}
                  >
                    {card.value}
                  </span>
                  {card.previous !== undefined && (
                    <DeltaBadge
                      current={card.current}
                      previous={card.previous}
                      invert={card.invert}
                    />
                  )}
                </div>
                {card.subtitle && (
                  <div
                    className="text-[10px] mt-1"
                    style={{
                      fontFamily: "var(--mono)",
                      color: "var(--text-muted)",
                    }}
                  >
                    {card.subtitle}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Onboarding Chart */}
          {data.steps.length > 0 && <OnboardingChart steps={data.steps} />}

          {/* Drop-off table */}
          {data.steps.length > 1 && (
            <div
              className="rounded-xl overflow-hidden fade-up"
              style={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="p-4 pb-0">
                <h3
                  className="text-xs font-semibold tracking-wider"
                  style={{ color: "var(--text-muted)" }}
                >
                  DROP-OFF POR ETAPA
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      {[
                        "#",
                        "Etapa",
                        "Fluxo",
                        "Usuários",
                        "Taxa Total",
                        "Drop Step",
                        "Perdidos",
                      ].map((h) => (
                        <th
                          key={h}
                          className={`px-4 py-3 text-[10px] font-semibold tracking-wider ${
                            [
                              "Usuários",
                              "Taxa Total",
                              "Drop Step",
                              "Perdidos",
                            ].includes(h)
                              ? "text-right"
                              : "text-left"
                          }`}
                          style={{ color: "var(--text-muted)" }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.steps.map((step, i) => {
                      const config = getStepConfig(step.stepNumber);
                      if (config?.skipped) return null;

                      const label = getStepLabel(
                        step.stepNumber,
                        step.stepName,
                      );
                      const prevStep = i > 0 ? data.steps[i - 1] : null;
                      const prevConfig = prevStep
                        ? getStepConfig(prevStep.stepNumber)
                        : null;

                      // Detect flow boundary: don't show drop when flow type changes
                      const flowChanged =
                        prevConfig &&
                        config &&
                        prevConfig.flow !== config.flow &&
                        prevConfig.flow !== "shared" &&
                        config.flow !== "shared";

                      const lost =
                        prevStep && !flowChanged
                          ? prevStep.users - step.users
                          : 0;

                      // Detect phase change for separator
                      const prevPhase = prevConfig?.phase;
                      const currentPhase = config?.phase;
                      const phaseChanged = i > 0 && prevPhase !== currentPhase;

                      const hasKeyEvent =
                        config?.keyEvents && config.keyEvents.length > 0;

                      return (
                        <>
                          {phaseChanged && currentPhase && (
                            <tr key={`phase-${currentPhase}`}>
                              <td
                                colSpan={7}
                                className="px-4 py-2 text-[10px] font-semibold tracking-wider"
                                style={{
                                  color: PHASE_DISPLAY[currentPhase].color,
                                  borderBottom: "1px solid var(--border)",
                                  backgroundColor: "var(--surface-alt)",
                                }}
                              >
                                {PHASE_DISPLAY[currentPhase].label}
                              </td>
                            </tr>
                          )}
                          <tr
                            key={step.stepNumber}
                            className="fade-up"
                            style={{
                              borderBottom: "1px solid var(--border)",
                              animationDelay: `${i * 0.03}s`,
                              backgroundColor:
                                step.stepRate < 70 && i > 0 && !flowChanged
                                  ? "rgba(239, 68, 68, 0.04)"
                                  : undefined,
                            }}
                          >
                            <td
                              className="px-4 py-2.5 text-xs"
                              style={{
                                fontFamily: "var(--mono)",
                                color: "var(--text-muted)",
                              }}
                            >
                              {step.stepNumber}
                            </td>
                            <td
                              className="px-4 py-2.5 text-xs"
                              style={{ color: "var(--text-dim)" }}
                            >
                              <div className="flex items-center gap-1.5">
                                {hasKeyEvent && (
                                  <span
                                    className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                                    style={{ backgroundColor: "var(--amber)" }}
                                    title={`Eventos: ${config!.keyEvents!.join(", ")}`}
                                  />
                                )}
                                {label}
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-xs">
                              {config?.flow === "new" && (
                                <span
                                  className="text-[9px] px-1 py-px rounded"
                                  style={{
                                    backgroundColor: "var(--accent-dim)",
                                    color: "var(--accent)",
                                    fontFamily: "var(--mono)",
                                  }}
                                >
                                  NOVO
                                </span>
                              )}
                              {config?.flow === "existing" && (
                                <span
                                  className="text-[9px] px-1 py-px rounded"
                                  style={{
                                    backgroundColor: "var(--blue-dim)",
                                    color: "var(--blue)",
                                    fontFamily: "var(--mono)",
                                  }}
                                >
                                  EXISTENTE
                                </span>
                              )}
                              {config?.flow === "shared" && (
                                <span
                                  className="text-[9px]"
                                  style={{ color: "var(--text-muted)" }}
                                >
                                  —
                                </span>
                              )}
                            </td>
                            <td
                              className="px-4 py-2.5 text-xs text-right"
                              style={{
                                fontFamily: "var(--mono)",
                                color: "var(--text)",
                              }}
                            >
                              {formatNumber(step.users)}
                            </td>
                            <td
                              className="px-4 py-2.5 text-xs text-right"
                              style={{
                                fontFamily: "var(--mono)",
                                color: "var(--accent)",
                              }}
                            >
                              {formatPercent(step.rate, 1)}
                            </td>
                            <td
                              className="px-4 py-2.5 text-xs text-right"
                              style={{
                                fontFamily: "var(--mono)",
                                color:
                                  !flowChanged && step.stepRate < 70 && i > 0
                                    ? "var(--red)"
                                    : "var(--text-dim)",
                              }}
                            >
                              {i === 0 || flowChanged
                                ? "—"
                                : formatPercent(step.stepRate, 1)}
                            </td>
                            <td
                              className="px-4 py-2.5 text-xs text-right"
                              style={{
                                fontFamily: "var(--mono)",
                                color:
                                  lost > 0 ? "var(--red)" : "var(--text-muted)",
                              }}
                            >
                              {i === 0 || flowChanged
                                ? "—"
                                : `-${formatNumber(lost)}`}
                            </td>
                          </tr>
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {data.steps.length === 0 && (
            <div
              className="rounded-xl p-8 text-center"
              style={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            >
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Nenhum dado de onboarding encontrado para o período selecionado.
              </p>
              <p
                className="text-xs mt-2"
                style={{ color: "var(--text-muted)" }}
              >
                Verifique se o sync foi executado e se há eventos
                onboarding_step no GA4.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
