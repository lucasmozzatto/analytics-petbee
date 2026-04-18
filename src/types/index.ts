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
  leads: number;
  vendas: number;
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

export interface FunnelGroup {
  title: string;
  steps: FunnelStep[];
  stepConversions: StepConversion[];
}

export interface FunnelData {
  steps: FunnelStep[];
  stepConversions: StepConversion[];
  funnels?: FunnelGroup[];
}

/* ===== Funnel Sources ===== */

export interface FunnelSource {
  source: string;
  leads: number;
}

/* ===== A/B Variants ===== */

export interface ABVariantSummary {
  variant: string;
  sessions: number;
  leads: number;
  convRate: number;
}

/* ===== Pages ===== */

export interface PageRow {
  pagePath: string;
  pageTitle: string;
  views: number;
  avgTimeOnPage: number;
  bounceRate: number;
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

/* ===== Onboarding ===== */

export interface OnboardingStep {
  stepNumber: number;
  stepName: string;
  users: number;
  eventCount: number;
  rate: number;
  stepRate: number;
}

export interface OnboardingFunnelData {
  steps: OnboardingStep[];
  totalStep1Users: number;
  previous?: {
    steps: OnboardingStep[];
    totalStep1Users: number;
  };
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

export interface ChannelDailyPoint {
  date: string;
  channel: string;
  sessions: number;
}

export interface TrafegoResponse {
  byChannel: ChannelRow[];
  bySourceMedium: SourceMediumRow[];
  byChannelDaily: ChannelDailyPoint[];
  previous?: { byChannel: ChannelRow[] };
}

/* ===== Funnel Page Config ===== */

export interface FunnelPageConfig {
  pagePath: string;
  blocked: boolean;
}

/* ===== Devices ===== */

export interface DeviceRow {
  deviceCategory: string;
  sessions: number;
  users: number;
  newUsers: number;
  bounceRate: number;
  avgSessionDuration: number;
  screenPageViews: number;
  leads: number;
  contracts: number;
  convRateLead: number;
  convRateContract: number;
}

/* ===== Heatmap ===== */

export interface HeatmapCell {
  dayOfWeek: number;
  hour: number;
  sessions: number;
  users: number;
}

/* ===== Geography ===== */

export interface GeoRow {
  region: string;
  city: string;
  sessions: number;
  users: number;
  newUsers: number;
  bounceRate: number;
  avgSessionDuration: number;
}

/* ===== Time Window ===== */

export interface TimeWindow {
  label: string;
  value: string;
}
