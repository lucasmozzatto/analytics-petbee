/* ===== KPIs ===== */

export interface KPIs {
  sessions: number;
  users: number;
  newUsers: number;
  bounceRate: number;
  avgSessionDuration: number;
  pageViews: number;
  leads: number;
  contracts: number;
  revenue: number;
  convRateLead: number;
  convRateContract: number;
}

/* ===== Timeseries ===== */

export interface TimeseriesPoint {
  date: string;
  sessions: number;
  users: number;
}

/* ===== Traffic ===== */

export interface ChannelRow {
  channel: string;
  sessions: number;
  users: number;
  bounceRate: number;
  avgSessionDuration: number;
  leads: number;
  contracts: number;
  convRateLead: number;
  convRateContract: number;
}

export interface SourceMediumRow {
  source: string;
  medium: string;
  sessions: number;
  users: number;
  leads: number;
  contracts: number;
  convRateLead: number;
  convRateContract: number;
}

/* ===== UTMs ===== */

export interface UTMRow {
  value: string;
  sessions: number;
  leads: number;
  contracts: number;
  convRateLead: number;
  convRateContract: number;
}

export type UTMDimension = 'campaign' | 'source' | 'medium' | 'content' | 'term';

/* ===== Funnel ===== */

export interface FunnelStep {
  name: string;
  event: string;
  count: number;
  rate: number;
}

export interface StepConversion {
  from: string;
  to: string;
  rate: number;
}

export interface FunnelData {
  steps: FunnelStep[];
  stepConversions: StepConversion[];
}

/* ===== Pages ===== */

export interface PageRow {
  pagePath: string;
  pageTitle: string;
  views: number;
  uniqueViews: number;
  avgTimeOnPage: number;
  bounceRate: number;
  exits: number;
}

/* ===== AI Insights ===== */

export interface InsightSummary {
  id: number;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface InsightFull extends InsightSummary {
  analysis: string;
}

/* ===== API Responses ===== */

export interface TopChannel {
  channel: string;
  sessions: number;
  percentage: number;
}

export interface VisaoGeralResponse {
  kpis: KPIs;
  timeseries: TimeseriesPoint[];
  topChannels?: TopChannel[];
  previous?: { kpis: KPIs };
}

export interface TrafegoResponse {
  byChannel: ChannelRow[];
  bySourceMedium: SourceMediumRow[];
  previous?: { byChannel: ChannelRow[] };
}

/* ===== Funnel Page Config ===== */

export interface FunnelPageConfig {
  pagePath: string;
  blocked: boolean;
}

/* ===== Time Window ===== */

export interface TimeWindow {
  label: string;
  value: string;
}
