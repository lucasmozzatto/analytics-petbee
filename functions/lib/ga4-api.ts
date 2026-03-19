import type { Env } from './types';
import { getAccessToken } from './google-auth';
import { formatGA4Date } from './date-utils';

// ── Types ──

export interface GA4DateRange {
  startDate: string;
  endDate: string;
}

export interface GA4Dimension {
  name: string;
}

export interface GA4Metric {
  name: string;
}

export interface GA4DimensionFilter {
  filter?: {
    fieldName: string;
    inListFilter?: {
      values: string[];
    };
    stringFilter?: {
      matchType: string;
      value: string;
    };
  };
  andGroup?: {
    expressions: GA4DimensionFilter[];
  };
  orGroup?: {
    expressions: GA4DimensionFilter[];
  };
}

export interface GA4ReportRequest {
  dateRanges: GA4DateRange[];
  dimensions: GA4Dimension[];
  metrics: GA4Metric[];
  dimensionFilter?: GA4DimensionFilter;
  limit?: number;
  offset?: number;
}

interface GA4Row {
  dimensionValues: { value: string }[];
  metricValues: { value: string }[];
}

interface GA4ReportResponse {
  rows?: GA4Row[];
  rowCount?: number;
  dimensionHeaders?: { name: string }[];
  metricHeaders?: { name: string; type: string }[];
}

// ── Core Report Runner ──

/**
 * Runs a GA4 Data API v1beta report with automatic pagination.
 * Fetches all rows by incrementing offset while rows.length === limit.
 */
export async function runReport(
  env: Env,
  request: GA4ReportRequest
): Promise<GA4ReportResponse> {
  const accessToken = await getAccessToken(env);
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${env.GA4_PROPERTY_ID}:runReport`;
  const limit = request.limit ?? 10000;

  let allRows: GA4Row[] = [];
  let offset = request.offset ?? 0;
  let dimensionHeaders: GA4ReportResponse['dimensionHeaders'];
  let metricHeaders: GA4ReportResponse['metricHeaders'];
  let totalRowCount = 0;

  while (true) {
    const body = {
      ...request,
      limit,
      offset,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GA4 Data API error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as GA4ReportResponse;

    // Capture headers from first response
    if (!dimensionHeaders) {
      dimensionHeaders = data.dimensionHeaders;
      metricHeaders = data.metricHeaders;
      totalRowCount = data.rowCount ?? 0;
    }

    const rows = data.rows ?? [];
    allRows = allRows.concat(rows);

    // If we got fewer rows than the limit, we've fetched everything
    if (rows.length < limit) {
      break;
    }

    offset += limit;
  }

  return {
    rows: allRows,
    rowCount: totalRowCount,
    dimensionHeaders,
    metricHeaders,
  };
}

// ── Session Fetcher ──

export interface SessionRow {
  date: string;
  channelGroup: string;
  source: string;
  medium: string;
  campaign: string;
  content: string;
  term: string;
  sessions: number;
  users: number;
  newUsers: number;
  bounceRate: number;
  avgSessionDuration: number;
  screenPageViews: number;
  engagedSessions: number;
}

/**
 * Fetches session data with full UTM breakdown from GA4.
 */
export async function fetchSessions(
  env: Env,
  startDate: string,
  endDate: string
): Promise<SessionRow[]> {
  const response = await runReport(env, {
    dateRanges: [{ startDate, endDate }],
    dimensions: [
      { name: 'date' },
      { name: 'sessionDefaultChannelGroup' },
      { name: 'sessionSource' },
      { name: 'sessionMedium' },
      { name: 'sessionCampaignName' },
      { name: 'sessionManualAdContent' },
      { name: 'sessionManualTerm' },
    ],
    metrics: [
      { name: 'sessions' },
      { name: 'totalUsers' },
      { name: 'newUsers' },
      { name: 'bounceRate' },
      { name: 'averageSessionDuration' },
      { name: 'screenPageViews' },
      { name: 'engagedSessions' },
    ],
  });

  if (!response.rows) return [];

  return response.rows.map((row) => ({
    date: formatGA4Date(row.dimensionValues[0].value),
    channelGroup: row.dimensionValues[1].value || '',
    source: row.dimensionValues[2].value || '',
    medium: row.dimensionValues[3].value || '',
    campaign: row.dimensionValues[4].value || '',
    content: row.dimensionValues[5].value || '',
    term: row.dimensionValues[6].value || '',
    sessions: parseInt(row.metricValues[0].value, 10) || 0,
    users: parseInt(row.metricValues[1].value, 10) || 0,
    newUsers: parseInt(row.metricValues[2].value, 10) || 0,
    bounceRate: parseFloat(row.metricValues[3].value) || 0,
    avgSessionDuration: parseFloat(row.metricValues[4].value) || 0,
    screenPageViews: parseInt(row.metricValues[5].value, 10) || 0,
    engagedSessions: parseInt(row.metricValues[6].value, 10) || 0,
  }));
}

// ── Conversion Fetcher ──

export interface ConversionRow {
  date: string;
  eventName: string;
  source: string;
  medium: string;
  campaign: string;
  content: string;
  term: string;
  eventCount: number;
  eventValue: number;
}

export const CONVERSION_EVENTS = [
  'generate_lead',
  'click_whatsapp',
  'add_to_cart',
  'begin_checkout',
  'add_payment_info',
  'purchase',
];

/**
 * Fetches conversion events (lead, cart, checkout, payment, purchase) from GA4.
 */
export async function fetchConversions(
  env: Env,
  startDate: string,
  endDate: string
): Promise<ConversionRow[]> {
  const response = await runReport(env, {
    dateRanges: [{ startDate, endDate }],
    dimensions: [
      { name: 'date' },
      { name: 'eventName' },
      { name: 'sessionSource' },
      { name: 'sessionMedium' },
      { name: 'sessionCampaignName' },
      { name: 'sessionManualAdContent' },
      { name: 'sessionManualTerm' },
    ],
    metrics: [
      { name: 'eventCount' },
      { name: 'eventValue' },
    ],
    dimensionFilter: {
      filter: {
        fieldName: 'eventName',
        inListFilter: {
          values: CONVERSION_EVENTS,
        },
      },
    },
  });

  if (!response.rows) return [];

  return response.rows.map((row) => ({
    date: formatGA4Date(row.dimensionValues[0].value),
    eventName: row.dimensionValues[1].value || '',
    source: row.dimensionValues[2].value || '',
    medium: row.dimensionValues[3].value || '',
    campaign: row.dimensionValues[4].value || '',
    content: row.dimensionValues[5].value || '',
    term: row.dimensionValues[6].value || '',
    eventCount: parseInt(row.metricValues[0].value, 10) || 0,
    eventValue: parseFloat(row.metricValues[1].value) || 0,
  }));
}

// ── Daily Conversions Fetcher (aggregated, no UTM breakdown) ──

export interface DailyConversionRow {
  date: string;
  eventName: string;
  sessionsWithEvent: number;
  eventCount: number;
  eventValue: number;
}

/**
 * Fetches conversion events aggregated by date+eventName only (no UTM dimensions).
 * Uses `sessions` metric which, combined with `eventName` dimension, gives
 * unique sessions where the event occurred — matching GA4 UI "Key events".
 */
export async function fetchDailyConversions(
  env: Env,
  startDate: string,
  endDate: string
): Promise<DailyConversionRow[]> {
  const response = await runReport(env, {
    dateRanges: [{ startDate, endDate }],
    dimensions: [
      { name: 'date' },
      { name: 'eventName' },
    ],
    metrics: [
      { name: 'sessions' },
      { name: 'eventCount' },
      { name: 'eventValue' },
    ],
    dimensionFilter: {
      filter: {
        fieldName: 'eventName',
        inListFilter: {
          values: CONVERSION_EVENTS,
        },
      },
    },
  });

  if (!response.rows) return [];

  return response.rows.map((row) => ({
    date: formatGA4Date(row.dimensionValues[0].value),
    eventName: row.dimensionValues[1].value || '',
    sessionsWithEvent: parseInt(row.metricValues[0].value, 10) || 0,
    eventCount: parseInt(row.metricValues[1].value, 10) || 0,
    eventValue: parseFloat(row.metricValues[2].value) || 0,
  }));
}

// ── Daily Totals Fetcher ──

export interface DailyTotalRow {
  date: string;
  sessions: number;
  users: number;
  newUsers: number;
  bounceRate: number;
  avgSessionDuration: number;
  screenPageViews: number;
  engagedSessions: number;
}

/**
 * Fetches aggregated daily totals WITHOUT UTM breakdown from GA4.
 * Only `date` as dimension — gives true deduplicated user counts.
 */
export async function fetchDailyTotals(
  env: Env,
  startDate: string,
  endDate: string
): Promise<DailyTotalRow[]> {
  const response = await runReport(env, {
    dateRanges: [{ startDate, endDate }],
    dimensions: [
      { name: 'date' },
    ],
    metrics: [
      { name: 'sessions' },
      { name: 'totalUsers' },
      { name: 'newUsers' },
      { name: 'bounceRate' },
      { name: 'averageSessionDuration' },
      { name: 'screenPageViews' },
      { name: 'engagedSessions' },
    ],
  });

  if (!response.rows) return [];

  return response.rows.map((row) => ({
    date: formatGA4Date(row.dimensionValues[0].value),
    sessions: parseInt(row.metricValues[0].value, 10) || 0,
    users: parseInt(row.metricValues[1].value, 10) || 0,
    newUsers: parseInt(row.metricValues[2].value, 10) || 0,
    bounceRate: parseFloat(row.metricValues[3].value) || 0,
    avgSessionDuration: parseFloat(row.metricValues[4].value) || 0,
    screenPageViews: parseInt(row.metricValues[5].value, 10) || 0,
    engagedSessions: parseInt(row.metricValues[6].value, 10) || 0,
  }));
}

// ── Page Fetcher ──

export interface PageRow {
  date: string;
  pagePath: string;
  pageTitle: string;
  screenPageViews: number;
  avgTimeOnPage: number;
  bounceRate: number;
}

/**
 * Fetches page-level metrics from GA4.
 */
export async function fetchPages(
  env: Env,
  startDate: string,
  endDate: string
): Promise<PageRow[]> {
  const response = await runReport(env, {
    dateRanges: [{ startDate, endDate }],
    dimensions: [
      { name: 'date' },
      { name: 'pagePath' },
      { name: 'pageTitle' },
    ],
    metrics: [
      { name: 'screenPageViews' },
      { name: 'averageSessionDuration' },
      { name: 'bounceRate' },
    ],
  });

  if (!response.rows) return [];

  return response.rows.map((row) => ({
    date: formatGA4Date(row.dimensionValues[0].value),
    pagePath: row.dimensionValues[1].value || '',
    pageTitle: row.dimensionValues[2].value || '',
    screenPageViews: parseInt(row.metricValues[0].value, 10) || 0,
    avgTimeOnPage: parseFloat(row.metricValues[1].value) || 0,
    bounceRate: parseFloat(row.metricValues[2].value) || 0,
  }));
}

// ── Page Conversion Fetcher ──

export interface PageConversionRow {
  date: string;
  eventName: string;
  pagePath: string;
  eventCount: number;
  eventValue: number;
}

/**
 * Fetches conversion events broken down by page path from GA4.
 * Dimensions: date, eventName, pagePath
 * Metrics: eventCount, eventValue
 * Filtered to CONVERSION_EVENTS only.
 */
export async function fetchPageConversions(
  env: Env,
  startDate: string,
  endDate: string
): Promise<PageConversionRow[]> {
  const response = await runReport(env, {
    dateRanges: [{ startDate, endDate }],
    dimensions: [
      { name: 'date' },
      { name: 'eventName' },
      { name: 'pagePath' },
    ],
    metrics: [
      { name: 'eventCount' },
      { name: 'eventValue' },
    ],
    dimensionFilter: {
      filter: {
        fieldName: 'eventName',
        inListFilter: {
          values: CONVERSION_EVENTS,
        },
      },
    },
  });

  if (!response.rows) return [];

  return response.rows.map((row) => ({
    date: formatGA4Date(row.dimensionValues[0].value),
    eventName: row.dimensionValues[1].value || '',
    pagePath: row.dimensionValues[2].value || '',
    eventCount: parseInt(row.metricValues[0].value, 10) || 0,
    eventValue: parseFloat(row.metricValues[1].value) || 0,
  }));
}
