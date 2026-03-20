import type {
  VisaoGeralResponse,
  TrafegoResponse,
  UTMRow,
  UTMDimension,
  FunnelData,
  FunnelPageConfig,
  PageRow,
  InsightFull,
  InsightSummary,
  OnboardingFunnelData,
} from '../types';

/**
 * Generic fetch wrapper for /api/* endpoints.
 * Uses relative URLs so requests go to the same origin (Cloudflare Worker).
 */
async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {};

  if (options?.method === 'POST') {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(path, {
    ...options,
    headers: {
      ...headers,
      ...(options?.headers as Record<string, string> | undefined),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

/* ===== Query param helpers ===== */

function dateParams(startDate: string, endDate: string, compare?: boolean): string {
  const params = new URLSearchParams({ startDate, endDate });
  if (compare) params.set('compare', 'true');
  return params.toString();
}

/* ===== Endpoints ===== */

/**
 * GET /api/metrics/visao-geral
 * Returns KPIs, timeseries, and optionally previous period data.
 */
export function getVisaoGeral(
  startDate: string,
  endDate: string,
  compare?: boolean
): Promise<VisaoGeralResponse> {
  return fetchAPI<VisaoGeralResponse>(
    `/api/metrics/visao-geral?${dateParams(startDate, endDate, compare)}`
  );
}

/**
 * GET /api/metrics/trafego
 * Returns traffic data by channel and source/medium.
 */
export function getTrafego(
  startDate: string,
  endDate: string,
  compare?: boolean
): Promise<TrafegoResponse> {
  return fetchAPI<TrafegoResponse>(
    `/api/metrics/trafego?${dateParams(startDate, endDate, compare)}`
  );
}

/**
 * GET /api/metrics/utms
 * Returns UTM analysis by the given dimension.
 */
export function getUTMs(
  startDate: string,
  endDate: string,
  dimension: UTMDimension
): Promise<UTMRow[]> {
  const params = new URLSearchParams({ startDate, endDate, dimension });
  return fetchAPI<UTMRow[]>(`/api/metrics/utms?${params.toString()}`);
}

/**
 * GET /api/metrics/funil
 * Returns funnel steps and step-to-step conversion rates.
 * Optionally filtered by page path.
 */
export function getFunil(
  startDate: string,
  endDate: string,
  compare?: boolean,
  page?: string,
  hostname?: string
): Promise<FunnelData> {
  const params = new URLSearchParams({ startDate, endDate });
  if (compare) params.set('compare', 'true');
  if (page) params.set('page', page);
  if (hostname) params.set('hostname', hostname);
  return fetchAPI<FunnelData>(`/api/metrics/funil?${params.toString()}`);
}

/**
 * GET /api/metrics/funil/pages
 * Returns list of page paths that have conversion events.
 */
export function getFunilPages(
  startDate: string,
  endDate: string
): Promise<{ pages: string[] }> {
  const params = new URLSearchParams({ startDate, endDate });
  return fetchAPI<{ pages: string[] }>(`/api/metrics/funil/pages?${params.toString()}`);
}

/**
 * GET /api/metrics/paginas
 * Returns paginated top pages data.
 */
export function getPaginas(
  startDate: string,
  endDate: string,
  page: number,
  pageSize: number
): Promise<{ data: PageRow[]; total: number }> {
  const params = new URLSearchParams({
    startDate,
    endDate,
    page: String(page),
    pageSize: String(pageSize),
  });
  return fetchAPI<{ data: PageRow[]; total: number }>(
    `/api/metrics/paginas?${params.toString()}`
  );
}

/**
 * GET /api/metrics/onboarding
 * Returns onboarding funnel steps and optionally previous period data.
 */
export function getOnboarding(
  startDate: string,
  endDate: string,
  compare?: boolean
): Promise<OnboardingFunnelData> {
  return fetchAPI<OnboardingFunnelData>(
    `/api/metrics/onboarding?${dateParams(startDate, endDate, compare)}`
  );
}

/**
 * POST /api/insights/analyze
 * Generates a new AI analysis for the given period.
 */
export function generateInsight(
  startDate: string,
  endDate: string,
  systemPrompt?: string,
  userPrompt?: string
): Promise<InsightFull> {
  return fetchAPI<InsightFull>('/api/insights/analyze', {
    method: 'POST',
    body: JSON.stringify({ startDate, endDate, systemPrompt, userPrompt }),
  });
}

/**
 * GET /api/insights/history
 * Returns list of saved AI analyses (without full text).
 */
export function getInsightHistory(): Promise<InsightSummary[]> {
  return fetchAPI<InsightSummary[]>('/api/insights/history');
}

/**
 * GET /api/insights/:id
 * Returns a single AI analysis by ID.
 */
export function getInsight(id: number): Promise<InsightFull> {
  return fetchAPI<InsightFull>(`/api/insights/${id}`);
}

/**
 * GET /api/config/funnel-pages
 * Returns all pages with blocked status for the funnel page selector.
 */
export function getFunnelPageConfig(): Promise<{ pages: FunnelPageConfig[] }> {
  return fetchAPI<{ pages: FunnelPageConfig[] }>('/api/config/funnel-pages');
}

/**
 * POST /api/config/funnel-pages
 * Updates which pages are blocked/unblocked in the funnel page selector.
 */
export function updateFunnelPageConfig(
  blocked: string[],
  unblocked: string[]
): Promise<{ success: boolean; updated: number }> {
  return fetchAPI<{ success: boolean; updated: number }>('/api/config/funnel-pages', {
    method: 'POST',
    body: JSON.stringify({ blocked, unblocked }),
  });
}
