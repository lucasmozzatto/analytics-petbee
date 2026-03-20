import type { Env } from './functions/lib/types';
import { getAccessToken } from './functions/lib/google-auth';
import { fetchSessions, fetchConversions, fetchPages, fetchPageConversions, fetchDailyTotals, fetchDailyConversions, fetchOnboardingSteps } from './functions/lib/ga4-api';
import { todaySP, yesterdaySP, getPreviousPeriod } from './functions/lib/date-utils';
import {
  syncSessions,
  syncConversions,
  syncPages,
  syncPageConversions,
  syncDailyTotals,
  syncDailyConversions,
  syncOnboardingSteps,
  queryKPIs,
  queryTimeseries,
  queryByChannel,
  queryBySourceMedium,
  queryByUTMDimension,
  queryFunnel,
  queryPageFunnel,
  queryFunnelPages,
  queryBlockedFunnelPages,
  updateBlockedFunnelPages,
  queryPages,
  queryInsightHistory,
  queryInsight,
  saveInsight,
  queryOnboardingFunnel,
} from './functions/lib/d1';

import type {
  KPIs,
  ChannelRow,
  UTMDimensionRow,
  FunnelData,
  PageDataRow,
} from './functions/lib/d1';

// ── CORS Headers ──

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}

function errorResponse(message: string, status = 500): Response {
  return jsonResponse({ error: message }, status);
}

// ── Helpers ──

function getDateParams(url: URL): { startDate: string; endDate: string } {
  const startDate = url.searchParams.get('startDate') ?? yesterdaySP();
  const endDate = url.searchParams.get('endDate') ?? todaySP();
  return { startDate, endDate };
}

function daysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

function pctVar(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? '+100%' : '0%';
  const change = ((current - previous) / previous) * 100;
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

function formatPercent(value: number): string {
  return value.toFixed(2) + '%';
}

// ── Route Handler ──

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // Only handle /api/* routes
    if (!pathname.startsWith('/api/')) {
      return jsonResponse({ error: 'Not found' }, 404);
    }

    try {
      // ────────────────────────────────────────────────
      // GET /api/metrics/visao-geral
      // ────────────────────────────────────────────────
      if (pathname === '/api/metrics/visao-geral' && method === 'GET') {
        const { startDate, endDate } = getDateParams(url);
        const compare = url.searchParams.get('compare') === 'true';

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
          percentage: totalSessions > 0 ? (ch.sessions / totalSessions) * 100 : 0,
        }));

        const result: Record<string, unknown> = {
          kpis,
          timeseries,
          topChannels,
        };

        if (compare) {
          const prev = getPreviousPeriod(startDate, endDate);
          const previousKPIs = await queryKPIs(env.DB, prev.startDate, prev.endDate);
          result.previous = { kpis: previousKPIs };
        }

        return jsonResponse(result);
      }

      // ────────────────────────────────────────────────
      // GET /api/metrics/trafego
      // ────────────────────────────────────────────────
      if (pathname === '/api/metrics/trafego' && method === 'GET') {
        const { startDate, endDate } = getDateParams(url);
        const compare = url.searchParams.get('compare') === 'true';

        const [byChannel, bySourceMedium] = await Promise.all([
          queryByChannel(env.DB, startDate, endDate),
          queryBySourceMedium(env.DB, startDate, endDate),
        ]);

        const result: Record<string, unknown> = {
          byChannel,
          bySourceMedium,
        };

        if (compare) {
          const prev = getPreviousPeriod(startDate, endDate);
          const previousByChannel = await queryByChannel(env.DB, prev.startDate, prev.endDate);
          result.previous = { byChannel: previousByChannel };
        }

        return jsonResponse(result);
      }

      // ────────────────────────────────────────────────
      // GET /api/metrics/utms
      // ────────────────────────────────────────────────
      if (pathname === '/api/metrics/utms' && method === 'GET') {
        const { startDate, endDate } = getDateParams(url);
        const dimension = (url.searchParams.get('dimension') ?? 'campaign') as
          | 'campaign'
          | 'source'
          | 'medium'
          | 'content'
          | 'term';

        const validDimensions = ['campaign', 'source', 'medium', 'content', 'term'];
        if (!validDimensions.includes(dimension)) {
          return errorResponse('Invalid dimension. Must be one of: campaign, source, medium, content, term', 400);
        }

        const data = await queryByUTMDimension(env.DB, startDate, endDate, dimension);
        return jsonResponse(data);
      }

      // ────────────────────────────────────────────────
      // GET /api/metrics/funil/pages
      // ────────────────────────────────────────────────
      if (pathname === '/api/metrics/funil/pages' && method === 'GET') {
        const { startDate, endDate } = getDateParams(url);
        const pages = await queryFunnelPages(env.DB, startDate, endDate);
        return jsonResponse({ pages });
      }

      // ────────────────────────────────────────────────
      // GET /api/metrics/funil
      // ────────────────────────────────────────────────
      if (pathname === '/api/metrics/funil' && method === 'GET') {
        const { startDate, endDate } = getDateParams(url);
        const compare = url.searchParams.get('compare') === 'true';
        const pagePath = url.searchParams.get('page') ?? undefined;

        const funnel = pagePath
          ? await queryPageFunnel(env.DB, startDate, endDate, pagePath)
          : await queryFunnel(env.DB, startDate, endDate);

        const result: Record<string, unknown> = {
          steps: funnel.steps,
          stepConversions: funnel.stepConversions,
        };

        if (compare) {
          const prev = getPreviousPeriod(startDate, endDate);
          const previousFunnel = pagePath
            ? await queryPageFunnel(env.DB, prev.startDate, prev.endDate, pagePath)
            : await queryFunnel(env.DB, prev.startDate, prev.endDate);
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
      if (pathname === '/api/metrics/onboarding' && method === 'GET') {
        const { startDate, endDate } = getDateParams(url);
        const compare = url.searchParams.get('compare') === 'true';

        const data = await queryOnboardingFunnel(env.DB, startDate, endDate);

        const result: Record<string, unknown> = {
          steps: data.steps,
          totalStep1Users: data.totalStep1Users,
        };

        if (compare) {
          const prev = getPreviousPeriod(startDate, endDate);
          const previousData = await queryOnboardingFunnel(env.DB, prev.startDate, prev.endDate);
          result.previous = {
            steps: previousData.steps,
            totalStep1Users: previousData.totalStep1Users,
          };
        }

        return jsonResponse(result);
      }

      // ────────────────────────────────────────────────
      // GET /api/metrics/paginas
      // ────────────────────────────────────────────────
      if (pathname === '/api/metrics/paginas' && method === 'GET') {
        const { startDate, endDate } = getDateParams(url);
        const page = parseInt(url.searchParams.get('page') ?? '1', 10);
        const pageSize = parseInt(url.searchParams.get('pageSize') ?? '20', 10);

        const result = await queryPages(env.DB, startDate, endDate, page, pageSize);
        return jsonResponse(result);
      }

      // ────────────────────────────────────────────────
      // GET /api/insights/history
      // ────────────────────────────────────────────────
      if (pathname === '/api/insights/history' && method === 'GET') {
        const history = await queryInsightHistory(env.DB);
        return jsonResponse(history);
      }

      // ────────────────────────────────────────────────
      // GET /api/insights/:id
      // ────────────────────────────────────────────────
      const insightMatch = pathname.match(/^\/api\/insights\/(\d+)$/);
      if (insightMatch && method === 'GET') {
        const id = parseInt(insightMatch[1], 10);
        const insight = await queryInsight(env.DB, id);
        if (!insight) {
          return errorResponse('Insight not found', 404);
        }
        return jsonResponse(insight);
      }

      // ────────────────────────────────────────────────
      // POST /api/insights/analyze
      // ────────────────────────────────────────────────
      if (pathname === '/api/insights/analyze' && method === 'POST') {
        const body = (await request.json()) as {
          startDate: string;
          endDate: string;
          systemPrompt?: string;
          userPrompt?: string;
        };

        const { startDate, endDate } = body;
        if (!startDate || !endDate) {
          return errorResponse('startDate and endDate are required', 400);
        }

        const nDias = daysBetween(startDate, endDate);
        const prev = getPreviousPeriod(startDate, endDate);

        // Query all data in parallel: current + previous period
        const [kpis, byChannel, utmCampaigns, funnel, pagesResult, prevKPIs, prevByChannel, prevUtmCampaigns] =
          await Promise.all([
            queryKPIs(env.DB, startDate, endDate),
            queryByChannel(env.DB, startDate, endDate),
            queryByUTMDimension(env.DB, startDate, endDate, 'campaign'),
            queryFunnel(env.DB, startDate, endDate),
            queryPages(env.DB, startDate, endDate, 1, 20),
            queryKPIs(env.DB, prev.startDate, prev.endDate),
            queryByChannel(env.DB, prev.startDate, prev.endDate),
            queryByUTMDimension(env.DB, prev.startDate, prev.endDate, 'campaign'),
          ]);

        // ── Build markdown tables ──

        // KPIs gerais
        const tabelaKPIs = [
          '| KPI | Valor |',
          '|-----|-------|',
          `| Sessões | ${kpis.sessions.toLocaleString('pt-BR')} |`,
          `| Usuários | ${kpis.users.toLocaleString('pt-BR')} |`,
          `| Novos Usuários | ${kpis.newUsers.toLocaleString('pt-BR')} |`,
          `| Bounce Rate | ${formatPercent(kpis.bounceRate)} |`,
          `| Duração Média | ${formatDuration(kpis.avgSessionDuration)} |`,
          `| Páginas/Sessão | ${kpis.sessions > 0 ? (kpis.pageViews / kpis.sessions).toFixed(2) : '0'} |`,
          `| Leads | ${kpis.leads.toLocaleString('pt-BR')} |`,
          `| Vendas | ${kpis.contracts.toLocaleString('pt-BR')} |`,
          `| Taxa Conv. Lead | ${formatPercent(kpis.convRateLead)} |`,
          `| Taxa Conv. Venda | ${formatPercent(kpis.convRateContract)} |`,
        ].join('\n');

        // Canais
        const tabelaCanais = [
          '| Canal | Sessões | Usuários | Bounce Rate | Duração | Leads | Vendas |',
          '|-------|---------|----------|-------------|---------|-------|-----------|',
          ...byChannel.map(
            (ch) =>
              `| ${ch.channel} | ${ch.sessions} | ${ch.users} | ${formatPercent(ch.bounceRate)} | ${formatDuration(ch.avgSessionDuration)} | ${ch.leads} | ${ch.contracts} |`
          ),
        ].join('\n');

        // UTMs (campaign with source/medium from top campaigns)
        const tabelaUtms = [
          '| Campanha | Sessões | Leads | Vendas | Conv. Lead | Conv. Venda |',
          '|----------|---------|-------|-----------|------------|----------------|',
          ...utmCampaigns
            .filter((u) => u.sessions > 0)
            .slice(0, 30)
            .map(
              (u) =>
                `| ${u.value} | ${u.sessions} | ${u.leads} | ${u.contracts} | ${formatPercent(u.convRateLead)} | ${formatPercent(u.convRateContract)} |`
            ),
        ].join('\n');

        // Funil
        const tabelaFunil = [
          '| Etapa | Contagem | % Total | % Step Anterior |',
          '|-------|----------|---------|-----------------|',
          ...funnel.steps.map((step, i) => {
            const stepRate =
              i > 0 && funnel.stepConversions[i - 1]
                ? formatPercent(funnel.stepConversions[i - 1].rate)
                : '—';
            return `| ${step.name} (${step.event}) | ${step.count} | ${formatPercent(step.rate)} | ${stepRate} |`;
          }),
        ].join('\n');

        // Páginas
        const tabelaPaginas = [
          '| Página | Views | Tempo Médio | Bounce Rate |',
          '|--------|-------|-------------|-------------|',
          ...pagesResult.data.slice(0, 20).map(
            (p) =>
              `| ${p.pagePath} | ${p.views} | ${formatDuration(p.avgTimeOnPage)} | ${formatPercent(p.bounceRate)} |`
          ),
        ].join('\n');

        // Variação por canal
        const variacaoCanais = [
          '| Canal | Sessões Atual | Sessões Anterior | Variação |',
          '|-------|---------------|------------------|----------|',
          ...byChannel.map((ch) => {
            const prevCh = prevByChannel.find((p) => p.channel === ch.channel);
            const prevSessions = prevCh?.sessions ?? 0;
            return `| ${ch.channel} | ${ch.sessions} | ${prevSessions} | ${pctVar(ch.sessions, prevSessions)} |`;
          }),
        ].join('\n');

        // Variação por UTM
        const variacaoUtms = [
          '| Campanha | Sessões Atual | Sessões Anterior | Variação | Leads Atual | Leads Anterior |',
          '|----------|---------------|------------------|----------|-------------|----------------|',
          ...utmCampaigns
            .filter((u) => u.sessions > 0)
            .slice(0, 20)
            .map((u) => {
              const prevU = prevUtmCampaigns.find((p) => p.value === u.value);
              const prevSessions = prevU?.sessions ?? 0;
              const prevLeads = prevU?.leads ?? 0;
              return `| ${u.value} | ${u.sessions} | ${prevSessions} | ${pctVar(u.sessions, prevSessions)} | ${u.leads} | ${prevLeads} |`;
            }),
        ].join('\n');

        // ── Calculate variations ──
        const varSessoes = pctVar(kpis.sessions, prevKPIs.sessions);
        const varLeads = pctVar(kpis.leads, prevKPIs.leads);
        const varVendas = pctVar(kpis.contracts, prevKPIs.contracts);
        const varBounce = pctVar(kpis.bounceRate, prevKPIs.bounceRate);
        const varDuracao = pctVar(kpis.avgSessionDuration, prevKPIs.avgSessionDuration);

        // ── System prompt ──
        const defaultSystemPrompt = `Você é um analista de Growth especializado em tráfego web e conversão para a Petbee, uma insurtech de saúde pet.

Contexto da Petbee:
- A Petbee oferece planos de saúde para pets (cães e gatos)
- O funil de conversão: Landing page (generate_lead) → site principal (add_to_cart → begin_checkout → add_payment_info → purchase)
- "Leads" = evento generate_lead (formulário preenchido na landing page)
- "Vendas" = evento purchase (venda efetivada)

Benchmarks de referência:
- Bounce rate landing page < 60%
- Duração média de sessão > 1m30s
- Taxa lead-to-venda > 8%
- CTR orgânico > 3%

Canais:
- Organic Search: tráfego orgânico do Google
- Paid Search: Google Ads
- Paid Social: Meta Ads (Facebook/Instagram)
- Direct: acesso direto
- Referral: links de outros sites
- Email: campanhas de email marketing

Regras da análise:
1. NUNCA descreva um número sem interpretá-lo. Sempre contextualize com benchmarks, tendências ou comparações.
2. Identifique padrões, anomalias e oportunidades acionáveis.
3. Priorize insights que levem a ações concretas de Growth.
4. Use linguagem direta, sem floreios. Seja específico.
5. Quando houver queda, sugira hipóteses e ações corretivas.
6. Quando houver crescimento, sugira como escalar.

Alertas obrigatórios (mencionar se detectado):
- Bounce rate > 60% em páginas de conversão
- Queda súbita de tráfego orgânico (> 20% vs período anterior)
- Campanhas UTM com alto volume de sessões mas zero conversão
- Taxa de conversão lead-to-venda abaixo de 5%
- Duração média de sessão < 30 segundos em qualquer canal`;

        const systemPrompt = body.systemPrompt || defaultSystemPrompt;

        // ── User prompt with placeholder replacement ──
        const defaultUserPrompt = `Analise os dados de tráfego e conversão da Petbee no período de {startDate} a {endDate} ({n_dias} dias).

{tabela_kpis_gerais}

{tabela_canais}

{tabela_utms}

{tabela_funil}

{tabela_paginas}

Variação vs período anterior:
- Sessões: {var_sessoes}
- Leads: {var_leads}
- Vendas: {var_contratos}
- Bounce Rate: {var_bounce}
- Duração Média: {var_duracao}`;

        let userPrompt = body.userPrompt || defaultUserPrompt;

        // Replace all placeholders
        const replacements: Record<string, string> = {
          '{startDate}': startDate,
          '{endDate}': endDate,
          '{n_dias}': nDias.toString(),
          '{var_sessoes}': varSessoes,
          '{var_leads}': varLeads,
          '{var_contratos}': varVendas,
          '{var_bounce}': varBounce,
          '{var_duracao}': varDuracao,
          '{tabela_kpis_gerais}': tabelaKPIs,
          '{tabela_canais}': tabelaCanais,
          '{tabela_utms}': tabelaUtms,
          '{tabela_funil}': tabelaFunil,
          '{tabela_paginas}': tabelaPaginas,
          '{variacao_canais}': variacaoCanais,
          '{variacao_utms}': variacaoUtms,
        };

        for (const [placeholder, value] of Object.entries(replacements)) {
          userPrompt = userPrompt.replaceAll(placeholder, value);
        }

        // ── Call Anthropic Claude API ──
        const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 8192,
            system: systemPrompt,
            messages: [
              {
                role: 'user',
                content: userPrompt,
              },
            ],
          }),
        });

        if (!anthropicResponse.ok) {
          const errText = await anthropicResponse.text();
          throw new Error(`Anthropic API error (${anthropicResponse.status}): ${errText}`);
        }

        const anthropicData = (await anthropicResponse.json()) as {
          content: { type: string; text: string }[];
        };

        const analysis =
          anthropicData.content
            ?.filter((block) => block.type === 'text')
            .map((block) => block.text)
            .join('\n') ?? '';

        // ── Save to D1 ──
        const insightId = await saveInsight(env.DB, startDate, endDate, analysis);

        return jsonResponse({
          id: insightId,
          analysis,
          createdAt: new Date().toISOString(),
        });
      }

      // ────────────────────────────────────────────────
      // GET /api/config/funnel-pages
      // ────────────────────────────────────────────────
      if (pathname === '/api/config/funnel-pages' && method === 'GET') {
        // Get all distinct pages from ga4_page_conversions (all time) + blocked status
        const allPagesResult = await env.DB
          .prepare(
            `SELECT DISTINCT page_path FROM ga4_page_conversions ORDER BY page_path`
          )
          .all();

        const allPages = (allPagesResult.results as Record<string, unknown>[]).map(
          (row) => row.page_path as string
        );

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
      if (pathname === '/api/config/funnel-pages' && method === 'POST') {
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
      if (pathname === '/api/sync/trigger' && method === 'POST') {
        // Validate Bearer token
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return errorResponse('Unauthorized: Missing Bearer token', 401);
        }

        const token = authHeader.slice('Bearer '.length).trim();
        if (token !== env.SYNC_SECRET) {
          return errorResponse('Unauthorized: Invalid token', 401);
        }

        // Get date range from query params or default to yesterday + today
        const startDate = url.searchParams.get('startDate') ?? yesterdaySP();
        const endDate = url.searchParams.get('endDate') ?? todaySP();

        // Get Google access token
        const accessToken = await getAccessToken(env);

        // Fetch all data from GA4 in parallel
        const [sessions, conversions, pages, pageConversions, dailyTotals, dailyConversions, onboardingSteps] = await Promise.all([
          fetchSessions(env, startDate, endDate),
          fetchConversions(env, startDate, endDate),
          fetchPages(env, startDate, endDate),
          fetchPageConversions(env, startDate, endDate),
          fetchDailyTotals(env, startDate, endDate),
          fetchDailyConversions(env, startDate, endDate),
          fetchOnboardingSteps(env, startDate, endDate),
        ]);

        // Sync all to D1
        const [syncedSessions, syncedConversions, syncedPages, syncedPageConversions, syncedDailyTotals, syncedDailyConversions, syncedOnboardingSteps] = await Promise.all([
          syncSessions(env.DB, sessions),
          syncConversions(env.DB, conversions),
          syncPages(env.DB, pages),
          syncPageConversions(env.DB, pageConversions),
          syncDailyTotals(env.DB, dailyTotals),
          syncDailyConversions(env.DB, dailyConversions),
          syncOnboardingSteps(env.DB, onboardingSteps),
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
          },
          dateRange: { startDate, endDate },
        });
      }

      // ────────────────────────────────────────────────
      // 404 — Unknown route
      // ────────────────────────────────────────────────
      return errorResponse('Not found', 404);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Internal server error';
      console.error('Worker error:', err);
      return errorResponse(message, 500);
    }
  },
} satisfies ExportedHandler<Env>;
