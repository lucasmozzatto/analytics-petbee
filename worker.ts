import type { Env } from "./functions/lib/types";
import { getAccessToken } from "./functions/lib/google-auth";
import {
  fetchSessions,
  fetchConversions,
  fetchPages,
  fetchPageConversions,
  fetchDailyTotals,
  fetchDailyConversions,
  fetchOnboardingSteps,
  fetchDeviceStats,
  fetchDeviceConversions,
  fetchHourlyStats,
  fetchGeoStats,
  fetchABVariants,
} from "./functions/lib/ga4-api";
import {
  todaySP,
  yesterdaySP,
  getPreviousPeriod,
} from "./functions/lib/date-utils";
import {
  syncSessions,
  syncConversions,
  syncPages,
  syncPageConversions,
  syncDailyTotals,
  syncDailyConversions,
  syncOnboardingSteps,
  syncDeviceStats,
  syncDeviceConversions,
  syncHourlyStats,
  syncGeoStats,
  syncABVariants,
  queryKPIs,
  queryTimeseries,
  queryByChannel,
  queryTimeseriesByChannel,
  queryBySourceMedium,
  queryByUTMDimension,
  queryFunnel,
  queryPageFunnel,
  queryFunnelPages,
  queryPageFunnelSources,
  queryBlockedFunnelPages,
  updateBlockedFunnelPages,
  queryPages,
  queryBlogTimeseries,
  queryBlogTopPages,
  queryTrafegoMonthly,
  queryInsightHistory,
  queryInsight,
  saveInsight,
  queryOnboardingFunnel,
  queryByDevice,
  queryHourlyHeatmap,
  queryByGeo,
  queryABVariants,
  queryABFunnel,
} from "./functions/lib/d1";

import type {
  KPIs,
  ChannelRow,
  UTMDimensionRow,
  FunnelData,
  PageDataRow,
} from "./functions/lib/d1";

// ── CORS Headers ──

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
    },
  });
}

function errorResponse(message: string, status = 500): Response {
  return jsonResponse({ error: message }, status);
}

// ── Helpers ──

function getDateParams(url: URL): { startDate: string; endDate: string } {
  const startDate = url.searchParams.get("startDate") ?? yesterdaySP();
  const endDate = url.searchParams.get("endDate") ?? todaySP();
  return { startDate, endDate };
}

function daysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return (
    Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  );
}

function pctVar(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? "+100%" : "0%";
  const change = ((current - previous) / previous) * 100;
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}%`;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

function formatPercent(value: number): string {
  return value.toFixed(2) + "%";
}

// ── Route Handler ──

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    // Handle CORS preflight
    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // Only handle /api/* routes
    if (!pathname.startsWith("/api/")) {
      return jsonResponse({ error: "Not found" }, 404);
    }

    try {
      // ────────────────────────────────────────────────
      // GET /api/metrics/visao-geral
      // ────────────────────────────────────────────────
      if (pathname === "/api/metrics/visao-geral" && method === "GET") {
        const { startDate, endDate } = getDateParams(url);
        const compare = url.searchParams.get("compare") === "true";

        const [kpis, timeseries, byChannel] = await Promise.all([
          queryKPIs(env.DB, startDate, endDate),
          queryTimeseries(env.DB, startDate, endDate),
          queryByChannel(env.DB, startDate, endDate),
        ]);

        // Top 4 channels by sessions with percentage
        const totalSessions = kpis.sessions;
        const topChannels = byChannel.slice(0, 4).map((ch) => ({
          channel: ch.channel,
          sessions: ch.sessions,
          percentage:
            totalSessions > 0 ? (ch.sessions / totalSessions) * 100 : 0,
        }));

        const result: Record<string, unknown> = {
          kpis,
          timeseries,
          topChannels,
        };

        if (compare) {
          const prev = getPreviousPeriod(startDate, endDate);
          const previousKPIs = await queryKPIs(
            env.DB,
            prev.startDate,
            prev.endDate,
          );
          result.previous = { kpis: previousKPIs };
        }

        return jsonResponse(result);
      }

      // ────────────────────────────────────────────────
      // GET /api/metrics/trafego
      // ────────────────────────────────────────────────
      if (pathname === "/api/metrics/trafego" && method === "GET") {
        const { startDate, endDate } = getDateParams(url);
        const compare = url.searchParams.get("compare") === "true";

        const [byChannel, bySourceMedium, byChannelDaily] = await Promise.all([
          queryByChannel(env.DB, startDate, endDate),
          queryBySourceMedium(env.DB, startDate, endDate),
          queryTimeseriesByChannel(env.DB, startDate, endDate),
        ]);

        const result: Record<string, unknown> = {
          byChannel,
          bySourceMedium,
          byChannelDaily,
        };

        if (compare) {
          const prev = getPreviousPeriod(startDate, endDate);
          const previousByChannel = await queryByChannel(
            env.DB,
            prev.startDate,
            prev.endDate,
          );
          result.previous = { byChannel: previousByChannel };
        }

        return jsonResponse(result);
      }

      // ────────────────────────────────────────────────
      // GET /api/metrics/trafego/monthly
      // ────────────────────────────────────────────────
      // Long-horizon monthly view independent of the page's TimeWindowPicker.
      if (pathname === "/api/metrics/trafego/monthly" && method === "GET") {
        const { startDate, endDate } = getDateParams(url);
        const timeseries = await queryTrafegoMonthly(
          env.DB,
          startDate,
          endDate,
        );
        return jsonResponse(timeseries);
      }

      // ────────────────────────────────────────────────
      // GET /api/metrics/utms
      // ────────────────────────────────────────────────
      if (pathname === "/api/metrics/utms" && method === "GET") {
        const { startDate, endDate } = getDateParams(url);
        const dimension = (url.searchParams.get("dimension") ?? "campaign") as
          | "campaign"
          | "source"
          | "medium"
          | "content"
          | "term";

        const validDimensions = [
          "campaign",
          "source",
          "medium",
          "content",
          "term",
        ];
        if (!validDimensions.includes(dimension)) {
          return errorResponse(
            "Invalid dimension. Must be one of: campaign, source, medium, content, term",
            400,
          );
        }

        const data = await queryByUTMDimension(
          env.DB,
          startDate,
          endDate,
          dimension,
        );
        return jsonResponse(data);
      }

      // ────────────────────────────────────────────────
      // GET /api/metrics/funil/pages
      // ────────────────────────────────────────────────
      if (pathname === "/api/metrics/funil/pages" && method === "GET") {
        const { startDate, endDate } = getDateParams(url);
        const hostname = url.searchParams.get("hostname") ?? undefined;
        const pages = await queryFunnelPages(
          env.DB,
          startDate,
          endDate,
          hostname,
        );
        return jsonResponse({ pages });
      }

      // ────────────────────────────────────────────────
      // GET /api/metrics/funil/sources
      // ────────────────────────────────────────────────
      if (pathname === "/api/metrics/funil/sources" && method === "GET") {
        const { startDate, endDate } = getDateParams(url);
        const hostname = url.searchParams.get("hostname") ?? undefined;
        const pagePath = url.searchParams.get("page") ?? undefined;
        const sources = await queryPageFunnelSources(
          env.DB,
          startDate,
          endDate,
          hostname,
          pagePath,
        );
        return jsonResponse({ sources });
      }

      // ────────────────────────────────────────────────
      // GET /api/metrics/funil/variants
      // ────────────────────────────────────────────────
      if (pathname === "/api/metrics/funil/variants" && method === "GET") {
        const { startDate, endDate } = getDateParams(url);
        const hostname = url.searchParams.get("hostname") ?? undefined;
        const pagePath = url.searchParams.get("page") ?? undefined;
        const variants = await queryABVariants(
          env.DB,
          startDate,
          endDate,
          hostname,
          pagePath,
        );
        return jsonResponse({ variants });
      }

      // ────────────────────────────────────────────────
      // GET /api/metrics/funil
      // ────────────────────────────────────────────────
      if (pathname === "/api/metrics/funil" && method === "GET") {
        const { startDate, endDate } = getDateParams(url);
        const compare = url.searchParams.get("compare") === "true";
        const pagePath = url.searchParams.get("page") ?? undefined;
        const hostname = url.searchParams.get("hostname") ?? undefined;
        const source = url.searchParams.get("source") ?? undefined;
        const variant = url.searchParams.get("variant") ?? undefined;

        // If a specific variant is selected, use the AB funnel query
        const funnel = variant
          ? await queryABFunnel(env.DB, startDate, endDate, variant, hostname, pagePath)
          : await queryPageFunnel(env.DB, startDate, endDate, pagePath, hostname, source);

        const result: Record<string, unknown> = {
          steps: funnel.steps,
          stepConversions: funnel.stepConversions,
        };

        if (funnel.funnels) {
          result.funnels = funnel.funnels;
        }

        if (compare) {
          const prev = getPreviousPeriod(startDate, endDate);
          const previousFunnel = variant
            ? await queryABFunnel(env.DB, prev.startDate, prev.endDate, variant, hostname, pagePath)
            : await queryPageFunnel(env.DB, prev.startDate, prev.endDate, pagePath, hostname, source);
          result.previous = {
            steps: previousFunnel.steps,
            stepConversions: previousFunnel.stepConversions,
          };
        }

        return jsonResponse(result);
      }

      // ────────────────────────────────────────────────
      // GET /api/metrics/onboarding
      // ────────────────────────────────────────────────
      if (pathname === "/api/metrics/onboarding" && method === "GET") {
        const { startDate, endDate } = getDateParams(url);
        const compare = url.searchParams.get("compare") === "true";

        const data = await queryOnboardingFunnel(env.DB, startDate, endDate);

        const result: Record<string, unknown> = {
          steps: data.steps,
          totalStep1Users: data.totalStep1Users,
        };

        if (compare) {
          const prev = getPreviousPeriod(startDate, endDate);
          const previousData = await queryOnboardingFunnel(
            env.DB,
            prev.startDate,
            prev.endDate,
          );
          result.previous = {
            steps: previousData.steps,
            totalStep1Users: previousData.totalStep1Users,
          };
        }

        return jsonResponse(result);
      }

      // ────────────────────────────────────────────────
      // GET /api/metrics/dispositivos
      // ────────────────────────────────────────────────
      if (pathname === "/api/metrics/dispositivos" && method === "GET") {
        const { startDate, endDate } = getDateParams(url);
        const data = await queryByDevice(env.DB, startDate, endDate);
        return jsonResponse(data);
      }

      // ────────────────────────────────────────────────
      // GET /api/metrics/horarios
      // ────────────────────────────────────────────────
      if (pathname === "/api/metrics/horarios" && method === "GET") {
        const { startDate, endDate } = getDateParams(url);
        const data = await queryHourlyHeatmap(env.DB, startDate, endDate);
        return jsonResponse(data);
      }

      // ────────────────────────────────────────────────
      // GET /api/metrics/geografia
      // ────────────────────────────────────────────────
      if (pathname === "/api/metrics/geografia" && method === "GET") {
        const { startDate, endDate } = getDateParams(url);
        const groupBy = (url.searchParams.get("groupBy") ?? "region") as
          | "region"
          | "city";
        if (groupBy !== "region" && groupBy !== "city") {
          return errorResponse(
            "Invalid groupBy. Must be 'region' or 'city'",
            400,
          );
        }
        const data = await queryByGeo(env.DB, startDate, endDate, groupBy);
        return jsonResponse(data);
      }

      // ────────────────────────────────────────────────
      // GET /api/metrics/paginas
      // ────────────────────────────────────────────────
      if (pathname === "/api/metrics/paginas" && method === "GET") {
        const { startDate, endDate } = getDateParams(url);
        const page = parseInt(url.searchParams.get("page") ?? "1", 10);
        const pageSize = parseInt(url.searchParams.get("pageSize") ?? "20", 10);

        const result = await queryPages(
          env.DB,
          startDate,
          endDate,
          page,
          pageSize,
        );
        return jsonResponse(result);
      }

      // ────────────────────────────────────────────────
      // GET /api/metrics/blog
      // ────────────────────────────────────────────────
      // TODO: leads atribuídos ao blog (sessões com pageview em /blog* que
      // depois geram generate_lead) — exige join entre ga4_pages e ga4_conversions
      // por session/cliente, ainda não disponível na sync atual.
      if (pathname === "/api/metrics/blog" && method === "GET") {
        const { startDate, endDate } = getDateParams(url);
        const limit = parseInt(url.searchParams.get("limit") ?? "10", 10);

        const [timeseries, topPages] = await Promise.all([
          queryBlogTimeseries(env.DB, startDate, endDate, "daily"),
          queryBlogTopPages(env.DB, startDate, endDate, limit),
        ]);

        return jsonResponse({ timeseries, topPages });
      }

      // ────────────────────────────────────────────────
      // GET /api/metrics/blog/monthly
      // ────────────────────────────────────────────────
      // Long-horizon monthly view independent of the page's TimeWindowPicker.
      if (pathname === "/api/metrics/blog/monthly" && method === "GET") {
        const { startDate, endDate } = getDateParams(url);
        const timeseries = await queryBlogTimeseries(
          env.DB,
          startDate,
          endDate,
          "monthly",
        );
        return jsonResponse(timeseries);
      }

      // ────────────────────────────────────────────────
      // GET /api/insights/history
      // ────────────────────────────────────────────────
      if (pathname === "/api/insights/history" && method === "GET") {
        const history = await queryInsightHistory(env.DB);
        return jsonResponse(history);
      }

      // ────────────────────────────────────────────────
      // GET /api/insights/:id
      // ────────────────────────────────────────────────
      const insightMatch = pathname.match(/^\/api\/insights\/(\d+)$/);
      if (insightMatch && method === "GET") {
        const id = parseInt(insightMatch[1], 10);
        const insight = await queryInsight(env.DB, id);
        if (!insight) {
          return errorResponse("Insight not found", 404);
        }
        return jsonResponse(insight);
      }

      // ────────────────────────────────────────────────
      // POST /api/insights/analyze
      // ────────────────────────────────────────────────
      if (pathname === "/api/insights/analyze" && method === "POST") {
        const body = (await request.json()) as {
          startDate: string;
          endDate: string;
          systemPrompt?: string;
          userPrompt?: string;
        };

        const { startDate, endDate } = body;
        if (!startDate || !endDate) {
          return errorResponse("startDate and endDate are required", 400);
        }

        const nDias = daysBetween(startDate, endDate);
        const prev = getPreviousPeriod(startDate, endDate);

        // Step labels for onboarding (server-side map)
        const STEP_LABELS: Record<number, string> = {
          5: 'Dados Pessoais', 6: 'Nome do Pet', 7: 'Espécie do Pet',
          8: 'Endereço', 9: 'Detalhes do Pet', 10: 'Raça do Pet',
          13: 'Plano', 14: 'Adic. Vacina', 15: 'Adic. Checkup',
          16: 'Adic. Dental', 17: 'Cadastro', 18: 'Confirmar Identidade',
          19: 'Resumo do Pet', 20: 'Checkout', 21: 'Pagamento', 22: 'Venda',
        };

        // Query all data in parallel: current + previous period + new sources
        const [
          kpis,
          byChannel,
          utmCampaigns,
          utmSources,
          utmMediums,
          funnel,
          lpFunnel,
          onboarding,
          pagesResult,
          prevKPIs,
          prevByChannel,
          prevUtmCampaigns,
        ] = await Promise.all([
          queryKPIs(env.DB, startDate, endDate),
          queryByChannel(env.DB, startDate, endDate),
          queryByUTMDimension(env.DB, startDate, endDate, "campaign"),
          queryByUTMDimension(env.DB, startDate, endDate, "source"),
          queryByUTMDimension(env.DB, startDate, endDate, "medium"),
          queryFunnel(env.DB, startDate, endDate),
          queryPageFunnel(env.DB, startDate, endDate, undefined, "lp.petbee.com.br"),
          queryOnboardingFunnel(env.DB, startDate, endDate),
          queryPages(env.DB, startDate, endDate, 1, 30),
          queryKPIs(env.DB, prev.startDate, prev.endDate),
          queryByChannel(env.DB, prev.startDate, prev.endDate),
          queryByUTMDimension(env.DB, prev.startDate, prev.endDate, "campaign"),
        ]);

        // ── Build markdown tables ──

        // KPIs gerais
        const tabelaKPIs = [
          "| KPI | Valor |",
          "|-----|-------|",
          `| Sessões | ${kpis.sessions.toLocaleString("pt-BR")} |`,
          `| Usuários | ${kpis.users.toLocaleString("pt-BR")} |`,
          `| Novos Usuários | ${kpis.newUsers.toLocaleString("pt-BR")} |`,
          `| Bounce Rate | ${formatPercent(kpis.bounceRate)} |`,
          `| Duração Média | ${formatDuration(kpis.avgSessionDuration)} |`,
          `| Páginas/Sessão | ${kpis.sessions > 0 ? (kpis.pageViews / kpis.sessions).toFixed(2) : "0"} |`,
          `| Leads | ${kpis.leads.toLocaleString("pt-BR")} |`,
          `| Vendas | ${kpis.contracts.toLocaleString("pt-BR")} |`,
          `| Taxa Conv. Lead | ${formatPercent(kpis.convRateLead)} |`,
          `| Taxa Conv. Venda | ${formatPercent(kpis.convRateContract)} |`,
        ].join("\n");

        // Canais
        const tabelaCanais = [
          "| Canal | Sessões | Usuários | Bounce Rate | Duração | Leads | Vendas |",
          "|-------|---------|----------|-------------|---------|-------|--------|",
          ...byChannel.map(
            (ch) =>
              `| ${ch.channel} | ${ch.sessions} | ${ch.users} | ${formatPercent(ch.bounceRate)} | ${formatDuration(ch.avgSessionDuration)} | ${ch.leads} | ${ch.contracts} |`,
          ),
        ].join("\n");

        // UTM Campaigns
        const tabelaUtmCampaigns = [
          "| Campanha | Sessões | Leads | Vendas | Conv. Lead | Conv. Venda |",
          "|----------|---------|-------|--------|------------|-------------|",
          ...utmCampaigns
            .filter((u) => u.sessions > 0)
            .slice(0, 30)
            .map(
              (u) =>
                `| ${u.value} | ${u.sessions} | ${u.leads} | ${u.contracts} | ${formatPercent(u.convRateLead)} | ${formatPercent(u.convRateContract)} |`,
            ),
        ].join("\n");

        // UTM Sources
        const tabelaUtmSources = [
          "| Source | Sessões | Leads | Vendas | Conv. Lead |",
          "|--------|---------|-------|--------|------------|",
          ...utmSources
            .filter((u) => u.sessions > 0)
            .slice(0, 20)
            .map(
              (u) =>
                `| ${u.value} | ${u.sessions} | ${u.leads} | ${u.contracts} | ${formatPercent(u.convRateLead)} |`,
            ),
        ].join("\n");

        // UTM Mediums
        const tabelaUtmMediums = [
          "| Medium | Sessões | Leads | Vendas | Conv. Lead |",
          "|--------|---------|-------|--------|------------|",
          ...utmMediums
            .filter((u) => u.sessions > 0)
            .slice(0, 15)
            .map(
              (u) =>
                `| ${u.value} | ${u.sessions} | ${u.leads} | ${u.contracts} | ${formatPercent(u.convRateLead)} |`,
            ),
        ].join("\n");

        // Funil global
        const tabelaFunil = [
          "| Etapa | Contagem | % Total | % Step Anterior |",
          "|-------|----------|---------|-----------------|",
          ...funnel.steps.map((step, i) => {
            const stepRate =
              i > 0 && funnel.stepConversions[i - 1]
                ? formatPercent(funnel.stepConversions[i - 1].rate)
                : "—";
            return `| ${step.name} (${step.event}) | ${step.count} | ${formatPercent(step.rate)} | ${stepRate} |`;
          }),
        ].join("\n");

        // Funil LP
        const tabelaFunilLP = [
          "| Etapa | Contagem | % Total | % Step Anterior |",
          "|-------|----------|---------|-----------------|",
          ...lpFunnel.steps.map((step, i) => {
            const stepRate =
              i > 0 && lpFunnel.stepConversions[i - 1]
                ? formatPercent(lpFunnel.stepConversions[i - 1].rate)
                : "—";
            return `| ${step.name} (${step.event}) | ${step.count} | ${formatPercent(step.rate)} | ${stepRate} |`;
          }),
        ].join("\n");

        // Onboarding
        const tabelaOnboarding = [
          "| # | Etapa | Usuários | % vs Início | % vs Anterior |",
          "|---|-------|----------|-------------|---------------|",
          ...onboarding.steps.map((step) => {
            const label = STEP_LABELS[step.stepNumber] || step.stepName;
            return `| ${step.stepNumber} | ${label} | ${step.users} | ${formatPercent(step.rate)} | ${formatPercent(step.stepRate)} |`;
          }),
        ].join("\n");

        // Páginas
        const tabelaPaginas = [
          "| Página | Views | Tempo Médio | Bounce Rate |",
          "|--------|-------|-------------|-------------|",
          ...pagesResult.data
            .slice(0, 30)
            .map(
              (p) =>
                `| ${p.pagePath} | ${p.views} | ${formatDuration(p.avgTimeOnPage)} | ${formatPercent(p.bounceRate)} |`,
            ),
        ].join("\n");

        // Variação por canal
        const variacaoCanais = [
          "| Canal | Sessões Atual | Sessões Anterior | Variação |",
          "|-------|---------------|------------------|----------|",
          ...byChannel.map((ch) => {
            const prevCh = prevByChannel.find((p) => p.channel === ch.channel);
            const prevSessions = prevCh?.sessions ?? 0;
            return `| ${ch.channel} | ${ch.sessions} | ${prevSessions} | ${pctVar(ch.sessions, prevSessions)} |`;
          }),
        ].join("\n");

        // Variação por UTM
        const variacaoUtms = [
          "| Campanha | Sessões Atual | Sessões Anterior | Variação | Leads Atual | Leads Anterior |",
          "|----------|---------------|------------------|----------|-------------|----------------|",
          ...utmCampaigns
            .filter((u) => u.sessions > 0)
            .slice(0, 20)
            .map((u) => {
              const prevU = prevUtmCampaigns.find((p) => p.value === u.value);
              const prevSessions = prevU?.sessions ?? 0;
              const prevLeads = prevU?.leads ?? 0;
              return `| ${u.value} | ${u.sessions} | ${prevSessions} | ${pctVar(u.sessions, prevSessions)} | ${u.leads} | ${prevLeads} |`;
            }),
        ].join("\n");

        // ── Calculate variations ──
        const varSessoes = pctVar(kpis.sessions, prevKPIs.sessions);
        const varLeads = pctVar(kpis.leads, prevKPIs.leads);
        const varVendas = pctVar(kpis.contracts, prevKPIs.contracts);
        const varBounce = pctVar(kpis.bounceRate, prevKPIs.bounceRate);
        const varDuracao = pctVar(
          kpis.avgSessionDuration,
          prevKPIs.avgSessionDuration,
        );

        // ── System prompt ──
        const defaultSystemPrompt = `Você é um analista de Growth da Petbee (insurtech de saúde pet). Seu relatório será apresentado ao time de marketing. Tom: técnico, direto, orientado a ação.

## Contexto do Negócio

A Petbee vende planos de saúde para pets (cães e gatos). A aquisição funciona em 3 estágios:

1. **Landing Pages** (lp.petbee.com.br) — campanhas pagas e orgânicas direcionam para LPs com formulário. Conversão principal: generate_lead.
2. **Website** (petbee.com.br) — site institucional com quiz/simulador de custos. Conversão principal: generate_lead via quiz.
3. **Onboarding** (app.petbee.com.br) — fluxo de contratação com ~16 steps (dados pessoais → pet → plano → cadastro → checkout → pagamento → venda). Conversão final: purchase.

## Funil completo

LP/Website (generate_lead) → Onboarding steps 5-20 → Pagamento (add_payment_info) → Venda (purchase)

## Definição de métricas

- **Leads** = evento generate_lead (formulário ou quiz completado)
- **Vendas** = evento purchase (contrato assinado)
- **Bounce Rate** = taxa de rejeição (0-100%)
- **Conv. Lead** = leads / sessões × 100
- **Conv. Venda** = vendas / sessões × 100

## Canais de tráfego

- Organic Search: Google orgânico
- Paid Search: Google Ads
- Paid Social: Meta Ads (Facebook/Instagram)
- Direct: acesso direto (url digitada ou bookmark)
- Referral: links de outros sites
- Email: campanhas de email marketing

## Onboarding Steps (para referência)

Step 5: Dados Pessoais → 6: Nome Pet → 7: Espécie → 8: Endereço → 9: Detalhes Pet → 10: Raça → 13: Plano → 14-16: Coberturas adicionais → 17: Cadastro → 18: Confirmação → 19: Resumo → 20: Checkout → 21: Pagamento → 22: Venda

## Regras da análise

1. NUNCA descreva um número sem interpretá-lo — sempre compare com benchmarks ou período anterior.
2. Priorize insights acionáveis: o time precisa saber O QUE fazer, não só o que aconteceu.
3. Identifique os 3 maiores gargalos de conversão (LP, onboarding ou UTM) e sugira ações concretas.
4. Destaque campanhas UTM com boa e má performance — o time decide onde investir mais.
5. Para cada problema identificado, sugira pelo menos uma ação específica.
6. Use linguagem acessível ao marketing mas com rigor técnico nos dados.

## Benchmarks

- Bounce rate LP: bom < 50%, aceitável < 60%, ruim > 70%
- Duração média sessão: bom > 2min, aceitável > 1min, ruim < 30s
- Conv. lead LP: bom > 5%, aceitável > 2%, ruim < 1%
- Onboarding completion (step 5 → 22): bom > 15%, aceitável > 8%, ruim < 5%
- Drop por step onboarding: aceitável < 15%, preocupante > 25%, crítico > 40%

## Alertas automáticos (sempre mencionar se detectado)

- Bounce rate > 65% em qualquer LP
- Campanha UTM com > 100 sessões e 0 leads
- Drop > 30% em qualquer step do onboarding
- Taxa lead-to-venda global < 5%
- Canal com queda > 20% vs período anterior`;

        const systemPrompt = body.systemPrompt || defaultSystemPrompt;

        // ── User prompt with placeholder replacement ──
        const defaultUserPrompt = `# Relatório de Performance — Petbee
**Período:** {startDate} a {endDate} ({n_dias} dias)

---

## 1. Visão Geral

{tabela_kpis_gerais}

**Variação vs período anterior:**
- Sessões: {var_sessoes}
- Leads: {var_leads}
- Vendas: {var_contratos}
- Bounce Rate: {var_bounce}
- Duração Média: {var_duracao}

## 2. Performance por Canal

{tabela_canais}

{variacao_canais}

## 3. Landing Pages — Funil de Conversão

Funil das LPs (lp.petbee.com.br):

{tabela_funil_lp}

Analise: quais etapas do funil LP têm maior drop-off? O bounce rate das LPs está dentro do benchmark?

## 4. Onboarding — Gargalos de Conversão

Funil de onboarding (app.petbee.com.br, steps 5-22):

{tabela_onboarding}

Analise: quais steps têm drop > 25%? Onde o onboarding está perdendo mais usuários? Sugira hipóteses para os 3 maiores gargalos.

## 5. UTMs — Campanhas

### Por campanha:
{tabela_utm_campaigns}

### Por source:
{tabela_utm_sources}

### Por medium:
{tabela_utm_mediums}

{variacao_utms}

Analise: quais campanhas estão trazendo mais leads com melhor custo-benefício? Há campanhas com muitas sessões e zero conversão (desperdício)?

## 6. Páginas Mais Acessadas

{tabela_paginas}

## 7. Funil Global

{tabela_funil}

---

**Formato de resposta esperado:**
1. **Resumo executivo** (3-4 bullets com os pontos mais importantes)
2. **Análise de LPs** (performance, bounce, conversão, recomendações)
3. **Gargalos do onboarding** (top 3 drops, hipóteses, ações)
4. **Destaques de UTMs** (melhores e piores campanhas, onde investir mais/menos)
5. **Alertas** (qualquer métrica fora dos benchmarks)
6. **Ações recomendadas** (lista priorizada de 3-5 ações concretas)`;

        let userPrompt = body.userPrompt || defaultUserPrompt;

        // Replace all placeholders
        const replacements: Record<string, string> = {
          "{startDate}": startDate,
          "{endDate}": endDate,
          "{n_dias}": nDias.toString(),
          "{var_sessoes}": varSessoes,
          "{var_leads}": varLeads,
          "{var_contratos}": varVendas,
          "{var_bounce}": varBounce,
          "{var_duracao}": varDuracao,
          "{tabela_kpis_gerais}": tabelaKPIs,
          "{tabela_canais}": tabelaCanais,
          "{tabela_utms}": tabelaUtmCampaigns,
          "{tabela_utm_campaigns}": tabelaUtmCampaigns,
          "{tabela_utm_sources}": tabelaUtmSources,
          "{tabela_utm_mediums}": tabelaUtmMediums,
          "{tabela_funil}": tabelaFunil,
          "{tabela_funil_lp}": tabelaFunilLP,
          "{tabela_onboarding}": tabelaOnboarding,
          "{tabela_paginas}": tabelaPaginas,
          "{variacao_canais}": variacaoCanais,
          "{variacao_utms}": variacaoUtms,
        };

        for (const [placeholder, value] of Object.entries(replacements)) {
          userPrompt = userPrompt.replaceAll(placeholder, value);
        }

        // ── Call Anthropic Claude API ──
        const anthropicResponse = await fetch(
          "https://api.anthropic.com/v1/messages",
          {
            method: "POST",
            headers: {
              "x-api-key": env.ANTHROPIC_API_KEY,
              "anthropic-version": "2023-06-01",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "claude-sonnet-4-6",
              max_tokens: 8192,
              system: systemPrompt,
              messages: [
                {
                  role: "user",
                  content: userPrompt,
                },
              ],
            }),
          },
        );

        if (!anthropicResponse.ok) {
          const errText = await anthropicResponse.text();
          throw new Error(
            `Anthropic API error (${anthropicResponse.status}): ${errText}`,
          );
        }

        const anthropicData = (await anthropicResponse.json()) as {
          content: { type: string; text: string }[];
        };

        const analysis =
          anthropicData.content
            ?.filter((block) => block.type === "text")
            .map((block) => block.text)
            .join("\n") ?? "";

        // ── Save to D1 ──
        const insightId = await saveInsight(
          env.DB,
          startDate,
          endDate,
          analysis,
        );

        return jsonResponse({
          id: insightId,
          analysis,
          createdAt: new Date().toISOString(),
        });
      }

      // ────────────────────────────────────────────────
      // GET /api/config/funnel-pages
      // ────────────────────────────────────────────────
      if (pathname === "/api/config/funnel-pages" && method === "GET") {
        // Get all distinct pages from ga4_page_conversions (all time) + blocked status
        const allPagesResult = await env.DB.prepare(
          `SELECT DISTINCT page_path FROM ga4_page_conversions ORDER BY page_path`,
        ).all();

        const allPages = (
          allPagesResult.results as Record<string, unknown>[]
        ).map((row) => row.page_path as string);

        const blockedPages = await queryBlockedFunnelPages(env.DB);
        const blockedSet = new Set(blockedPages);

        const pages = allPages.map((pagePath) => ({
          pagePath,
          blocked: blockedSet.has(pagePath),
        }));

        return jsonResponse({ pages });
      }

      // ────────────────────────────────────────────────
      // POST /api/config/funnel-pages
      // ────────────────────────────────────────────────
      if (pathname === "/api/config/funnel-pages" && method === "POST") {
        const body = (await request.json()) as {
          blocked?: string[];
          unblocked?: string[];
        };

        const blocked = body.blocked ?? [];
        const unblocked = body.unblocked ?? [];

        if (blocked.length === 0 && unblocked.length === 0) {
          return jsonResponse({ success: true, updated: 0 });
        }

        await updateBlockedFunnelPages(env.DB, blocked, unblocked);

        return jsonResponse({
          success: true,
          updated: blocked.length + unblocked.length,
        });
      }

      // ────────────────────────────────────────────────
      // POST /api/sync/trigger
      // ────────────────────────────────────────────────
      if (pathname === "/api/sync/trigger" && method === "POST") {
        // Validate Bearer token
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return errorResponse("Unauthorized: Missing Bearer token", 401);
        }

        const token = authHeader.slice("Bearer ".length).trim();
        if (token !== env.SYNC_SECRET) {
          return errorResponse("Unauthorized: Invalid token", 401);
        }

        // Get date range from query params or default to yesterday + today
        const startDate = url.searchParams.get("startDate") ?? yesterdaySP();
        const endDate = url.searchParams.get("endDate") ?? todaySP();

        // Get Google access token
        const accessToken = await getAccessToken(env);

        // Fetch all data from GA4 in parallel
        const [
          sessions,
          conversions,
          pages,
          pageConversions,
          dailyTotals,
          dailyConversions,
          onboardingSteps,
          deviceStats,
          deviceConversions,
          hourlyStats,
          geoStats,
          abVariants,
        ] = await Promise.all([
          fetchSessions(env, startDate, endDate),
          fetchConversions(env, startDate, endDate),
          fetchPages(env, startDate, endDate),
          fetchPageConversions(env, startDate, endDate),
          fetchDailyTotals(env, startDate, endDate),
          fetchDailyConversions(env, startDate, endDate),
          fetchOnboardingSteps(env, startDate, endDate),
          fetchDeviceStats(env, startDate, endDate),
          fetchDeviceConversions(env, startDate, endDate),
          fetchHourlyStats(env, startDate, endDate),
          fetchGeoStats(env, startDate, endDate),
          fetchABVariants(env, startDate, endDate),
        ]);

        // Sync all to D1
        const [
          syncedSessions,
          syncedConversions,
          syncedPages,
          syncedPageConversions,
          syncedDailyTotals,
          syncedDailyConversions,
          syncedOnboardingSteps,
          syncedDeviceStats,
          syncedDeviceConversions,
          syncedHourlyStats,
          syncedGeoStats,
          syncedABVariants,
        ] = await Promise.all([
          syncSessions(env.DB, sessions),
          syncConversions(env.DB, conversions),
          syncPages(env.DB, pages),
          syncPageConversions(env.DB, pageConversions),
          syncDailyTotals(env.DB, dailyTotals),
          syncDailyConversions(env.DB, dailyConversions),
          syncOnboardingSteps(env.DB, onboardingSteps),
          syncDeviceStats(env.DB, deviceStats),
          syncDeviceConversions(env.DB, deviceConversions),
          syncHourlyStats(env.DB, hourlyStats),
          syncGeoStats(env.DB, geoStats),
          syncABVariants(env.DB, abVariants),
        ]);

        return jsonResponse({
          success: true,
          synced: {
            sessions: syncedSessions,
            conversions: syncedConversions,
            pages: syncedPages,
            pageConversions: syncedPageConversions,
            dailyTotals: syncedDailyTotals,
            dailyConversions: syncedDailyConversions,
            onboardingSteps: syncedOnboardingSteps,
            deviceStats: syncedDeviceStats,
            deviceConversions: syncedDeviceConversions,
            hourlyStats: syncedHourlyStats,
            geoStats: syncedGeoStats,
            abVariants: syncedABVariants,
          },
          dateRange: { startDate, endDate },
        });
      }

      // ────────────────────────────────────────────────
      // 404 — Unknown route
      // ────────────────────────────────────────────────
      return errorResponse("Not found", 404);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Internal server error";
      console.error("Worker error:", err);
      return errorResponse(message, 500);
    }
  },
} satisfies ExportedHandler<Env>;
