import type { SessionRow, ConversionRow, PageRow, PageConversionRow, DailyTotalRow, DailyConversionRow, OnboardingStepRow } from './ga4-api';

// ── Sync Helpers ──

/**
 * Upserts session rows into ga4_sessions.
 * Batches in chunks of 100 for D1 limits.
 * Returns total number of rows synced.
 */
export async function syncSessions(db: D1Database, rows: SessionRow[]): Promise<number> {
  if (rows.length === 0) return 0;

  const sql = `
    INSERT INTO ga4_sessions (
      date_ref, channel_group, source, medium, campaign, content, term,
      sessions, users, new_users, bounce_rate, avg_session_duration,
      screen_page_views, engaged_sessions
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (date_ref, channel_group, source, medium, campaign, content, term)
    DO UPDATE SET
      sessions = excluded.sessions,
      users = excluded.users,
      new_users = excluded.new_users,
      bounce_rate = excluded.bounce_rate,
      avg_session_duration = excluded.avg_session_duration,
      screen_page_views = excluded.screen_page_views,
      engaged_sessions = excluded.engaged_sessions
  `;

  const chunks = chunkArray(rows, 100);
  for (const chunk of chunks) {
    const stmts = chunk.map((r) =>
      db.prepare(sql).bind(
        r.date,
        r.channelGroup,
        r.source,
        r.medium,
        r.campaign,
        r.content,
        r.term,
        r.sessions,
        r.users,
        r.newUsers,
        r.bounceRate,
        r.avgSessionDuration,
        r.screenPageViews,
        r.engagedSessions
      )
    );
    await db.batch(stmts);
  }

  return rows.length;
}

/**
 * Upserts conversion rows into ga4_conversions.
 * Batches in chunks of 100.
 */
export async function syncConversions(db: D1Database, rows: ConversionRow[]): Promise<number> {
  if (rows.length === 0) return 0;

  const sql = `
    INSERT INTO ga4_conversions (
      date_ref, event_name, source, medium, campaign, content, term,
      sessions_with_event, event_count, event_value
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (date_ref, event_name, source, medium, campaign, content, term)
    DO UPDATE SET
      sessions_with_event = excluded.sessions_with_event,
      event_count = excluded.event_count,
      event_value = excluded.event_value
  `;

  const chunks = chunkArray(rows, 100);
  for (const chunk of chunks) {
    const stmts = chunk.map((r) =>
      db.prepare(sql).bind(
        r.date,
        r.eventName,
        r.source,
        r.medium,
        r.campaign,
        r.content,
        r.term,
        r.keyEvents,
        r.eventCount,
        r.eventValue
      )
    );
    await db.batch(stmts);
  }

  return rows.length;
}

/**
 * Upserts page rows into ga4_pages.
 * Batches in chunks of 100.
 */
export async function syncPages(db: D1Database, rows: PageRow[]): Promise<number> {
  if (rows.length === 0) return 0;

  const sql = `
    INSERT INTO ga4_pages (
      date_ref, hostname, page_path, page_title,
      screen_page_views, avg_time_on_page, bounce_rate
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (date_ref, hostname, page_path)
    DO UPDATE SET
      page_title = excluded.page_title,
      screen_page_views = excluded.screen_page_views,
      avg_time_on_page = excluded.avg_time_on_page,
      bounce_rate = excluded.bounce_rate
  `;

  const chunks = chunkArray(rows, 100);
  for (const chunk of chunks) {
    const stmts = chunk.map((r) =>
      db.prepare(sql).bind(
        r.date,
        r.hostname,
        r.pagePath,
        r.pageTitle,
        r.screenPageViews,
        r.avgTimeOnPage,
        r.bounceRate
      )
    );
    await db.batch(stmts);
  }

  return rows.length;
}

/**
 * Upserts daily totals (aggregated without UTM breakdown) into ga4_daily_totals.
 * These give true deduplicated user counts.
 */
export async function syncDailyTotals(db: D1Database, rows: DailyTotalRow[]): Promise<number> {
  if (rows.length === 0) return 0;

  const sql = `
    INSERT INTO ga4_daily_totals (
      date_ref, sessions, users, new_users, bounce_rate,
      avg_session_duration, screen_page_views, engaged_sessions
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (date_ref)
    DO UPDATE SET
      sessions = excluded.sessions,
      users = excluded.users,
      new_users = excluded.new_users,
      bounce_rate = excluded.bounce_rate,
      avg_session_duration = excluded.avg_session_duration,
      screen_page_views = excluded.screen_page_views,
      engaged_sessions = excluded.engaged_sessions
  `;

  const chunks = chunkArray(rows, 100);
  for (const chunk of chunks) {
    const stmts = chunk.map((r) =>
      db.prepare(sql).bind(
        r.date,
        r.sessions,
        r.users,
        r.newUsers,
        r.bounceRate,
        r.avgSessionDuration,
        r.screenPageViews,
        r.engagedSessions
      )
    );
    await db.batch(stmts);
  }

  return rows.length;
}

/**
 * Upserts daily conversion totals (no UTM breakdown) into ga4_daily_conversions.
 * Uses sessions_with_event for accurate "Key events" count (1 per session).
 */
export async function syncDailyConversions(db: D1Database, rows: DailyConversionRow[]): Promise<number> {
  if (rows.length === 0) return 0;

  const sql = `
    INSERT INTO ga4_daily_conversions (
      date_ref, event_name, sessions_with_event, event_count, event_value
    ) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT (date_ref, event_name)
    DO UPDATE SET
      sessions_with_event = excluded.sessions_with_event,
      event_count = excluded.event_count,
      event_value = excluded.event_value
  `;

  const chunks = chunkArray(rows, 100);
  for (const chunk of chunks) {
    const stmts = chunk.map((r) =>
      db.prepare(sql).bind(
        r.date,
        r.eventName,
        r.sessionsWithEvent,
        r.eventCount,
        r.eventValue
      )
    );
    await db.batch(stmts);
  }

  return rows.length;
}

// ── Query Helpers for API Endpoints ──

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

/**
 * Returns aggregated KPIs for the given date range.
 * Uses ga4_daily_totals for accurate deduplicated user counts.
 * Bounce rate returned as 0-100 (percentage).
 * Leads = generate_lead events, Contracts = purchase events.
 */
export async function queryKPIs(
  db: D1Database,
  startDate: string,
  endDate: string
): Promise<KPIs> {
  const totalsQuery = db
    .prepare(
      `SELECT
        COALESCE(SUM(sessions), 0) AS sessions,
        COALESCE(SUM(users), 0) AS users,
        COALESCE(SUM(new_users), 0) AS new_users,
        CASE WHEN SUM(sessions) > 0
          THEN SUM(bounce_rate * sessions) / SUM(sessions)
          ELSE 0
        END AS bounce_rate,
        CASE WHEN SUM(sessions) > 0
          THEN SUM(avg_session_duration * sessions) / SUM(sessions)
          ELSE 0
        END AS avg_session_duration,
        COALESCE(SUM(screen_page_views), 0) AS page_views
      FROM ga4_daily_totals
      WHERE date_ref >= ? AND date_ref <= ?`
    )
    .bind(startDate, endDate);

  const leadsQuery = db
    .prepare(
      `SELECT COALESCE(SUM(sessions_with_event), 0) AS total
      FROM ga4_daily_conversions
      WHERE date_ref >= ? AND date_ref <= ? AND event_name = 'generate_lead'`
    )
    .bind(startDate, endDate);

  const contractsQuery = db
    .prepare(
      `SELECT COALESCE(SUM(sessions_with_event), 0) AS total, COALESCE(SUM(event_value), 0) AS revenue
      FROM ga4_daily_conversions
      WHERE date_ref >= ? AND date_ref <= ? AND event_name = 'purchase'`
    )
    .bind(startDate, endDate);

  const [totalsResult, leadsResult, contractsResult] = await db.batch([
    totalsQuery,
    leadsQuery,
    contractsQuery,
  ]);

  const s = totalsResult.results[0] as Record<string, number>;
  const leads = (leadsResult.results[0] as Record<string, number>)?.total ?? 0;
  const contractsRow = contractsResult.results[0] as Record<string, number>;
  const contracts = contractsRow?.total ?? 0;
  const revenue = contractsRow?.revenue ?? 0;

  const sessions = s?.sessions ?? 0;

  return {
    sessions,
    users: s?.users ?? 0,
    newUsers: s?.new_users ?? 0,
    bounceRate: (s?.bounce_rate ?? 0) * 100,
    avgSessionDuration: s?.avg_session_duration ?? 0,
    pageViews: s?.page_views ?? 0,
    leads,
    contracts,
    revenue,
    convRateLead: sessions > 0 ? (leads / sessions) * 100 : 0,
    convRateContract: sessions > 0 ? (contracts / sessions) * 100 : 0,
  };
}

export interface TimeseriesPoint {
  date: string;
  sessions: number;
  users: number;
  leads: number;
  vendas: number;
}

/**
 * Returns daily sessions, users, leads and vendas for the given date range.
 * Uses ga4_daily_totals for traffic and ga4_daily_conversions for events.
 */
export async function queryTimeseries(
  db: D1Database,
  startDate: string,
  endDate: string
): Promise<TimeseriesPoint[]> {
  const trafficQuery = db
    .prepare(
      `SELECT
        date_ref AS date,
        sessions,
        users
      FROM ga4_daily_totals
      WHERE date_ref >= ? AND date_ref <= ?
      ORDER BY date_ref ASC`
    )
    .bind(startDate, endDate);

  const conversionsQuery = db
    .prepare(
      `SELECT
        date_ref AS date,
        event_name,
        CASE WHEN sessions_with_event > 0 THEN sessions_with_event ELSE event_count END AS total
      FROM ga4_daily_conversions
      WHERE date_ref >= ? AND date_ref <= ?
        AND event_name IN ('generate_lead', 'purchase')
      ORDER BY date_ref ASC`
    )
    .bind(startDate, endDate);

  const [trafficResult, conversionsResult] = await db.batch([trafficQuery, conversionsQuery]);

  // Build conversion map: date → { leads, vendas }
  const convMap: Record<string, { leads: number; vendas: number }> = {};
  for (const row of conversionsResult.results as Record<string, unknown>[]) {
    const date = row.date as string;
    if (!convMap[date]) convMap[date] = { leads: 0, vendas: 0 };
    if (row.event_name === 'generate_lead') {
      convMap[date].leads = (row.total as number) ?? 0;
    } else if (row.event_name === 'purchase') {
      convMap[date].vendas = (row.total as number) ?? 0;
    }
  }

  return (trafficResult.results as Record<string, unknown>[]).map((row) => {
    const date = row.date as string;
    return {
      date,
      sessions: (row.sessions as number) ?? 0,
      users: (row.users as number) ?? 0,
      leads: convMap[date]?.leads ?? 0,
      vendas: convMap[date]?.vendas ?? 0,
    };
  });
}

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

/**
 * Returns sessions grouped by channel group with conversion counts joined.
 */
export async function queryByChannel(
  db: D1Database,
  startDate: string,
  endDate: string
): Promise<ChannelRow[]> {
  const result = await db
    .prepare(
      `SELECT
        s.channel_group AS channel,
        SUM(s.sessions) AS sessions,
        SUM(s.users) AS users,
        CASE WHEN SUM(s.sessions) > 0
          THEN SUM(s.bounce_rate * s.sessions) / SUM(s.sessions)
          ELSE 0
        END AS bounce_rate,
        CASE WHEN SUM(s.sessions) > 0
          THEN SUM(s.avg_session_duration * s.sessions) / SUM(s.sessions)
          ELSE 0
        END AS avg_session_duration,
        COALESCE(SUM(leads.total), 0) AS leads,
        COALESCE(SUM(contracts.total), 0) AS contracts
      FROM ga4_sessions s
      LEFT JOIN (
        SELECT date_ref, source, medium, campaign, content, term,
          CASE WHEN sessions_with_event > 0 THEN sessions_with_event ELSE event_count END AS total
        FROM ga4_conversions
        WHERE date_ref >= ? AND date_ref <= ? AND event_name = 'generate_lead'
      ) leads ON s.date_ref = leads.date_ref
        AND s.source = leads.source AND s.medium = leads.medium
        AND s.campaign = leads.campaign AND s.content = leads.content
        AND s.term = leads.term
      LEFT JOIN (
        SELECT date_ref, source, medium, campaign, content, term,
          CASE WHEN sessions_with_event > 0 THEN sessions_with_event ELSE event_count END AS total
        FROM ga4_conversions
        WHERE date_ref >= ? AND date_ref <= ? AND event_name = 'purchase'
      ) contracts ON s.date_ref = contracts.date_ref
        AND s.source = contracts.source AND s.medium = contracts.medium
        AND s.campaign = contracts.campaign AND s.content = contracts.content
        AND s.term = contracts.term
      WHERE s.date_ref >= ? AND s.date_ref <= ?
      GROUP BY s.channel_group
      ORDER BY sessions DESC`
    )
    .bind(startDate, endDate, startDate, endDate, startDate, endDate)
    .all();

  return (result.results as Record<string, unknown>[]).map((row) => {
    const sessions = (row.sessions as number) ?? 0;
    const leads = (row.leads as number) ?? 0;
    const contracts = (row.contracts as number) ?? 0;
    return {
      channel: row.channel as string,
      sessions,
      users: (row.users as number) ?? 0,
      bounceRate: ((row.bounce_rate as number) ?? 0) * 100,
      avgSessionDuration: (row.avg_session_duration as number) ?? 0,
      leads,
      contracts,
      convRateLead: sessions > 0 ? (leads / sessions) * 100 : 0,
      convRateContract: sessions > 0 ? (contracts / sessions) * 100 : 0,
    };
  });
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

/**
 * Returns sessions grouped by source+medium with conversion counts.
 */
export async function queryBySourceMedium(
  db: D1Database,
  startDate: string,
  endDate: string
): Promise<SourceMediumRow[]> {
  const result = await db
    .prepare(
      `SELECT
        s.source,
        s.medium,
        SUM(s.sessions) AS sessions,
        SUM(s.users) AS users,
        COALESCE(SUM(leads.total), 0) AS leads,
        COALESCE(SUM(contracts.total), 0) AS contracts
      FROM ga4_sessions s
      LEFT JOIN (
        SELECT date_ref, source, medium, campaign, content, term,
          CASE WHEN sessions_with_event > 0 THEN sessions_with_event ELSE event_count END AS total
        FROM ga4_conversions
        WHERE date_ref >= ? AND date_ref <= ? AND event_name = 'generate_lead'
      ) leads ON s.date_ref = leads.date_ref
        AND s.source = leads.source AND s.medium = leads.medium
        AND s.campaign = leads.campaign AND s.content = leads.content
        AND s.term = leads.term
      LEFT JOIN (
        SELECT date_ref, source, medium, campaign, content, term,
          CASE WHEN sessions_with_event > 0 THEN sessions_with_event ELSE event_count END AS total
        FROM ga4_conversions
        WHERE date_ref >= ? AND date_ref <= ? AND event_name = 'purchase'
      ) contracts ON s.date_ref = contracts.date_ref
        AND s.source = contracts.source AND s.medium = contracts.medium
        AND s.campaign = contracts.campaign AND s.content = contracts.content
        AND s.term = contracts.term
      WHERE s.date_ref >= ? AND s.date_ref <= ?
      GROUP BY s.source, s.medium
      ORDER BY sessions DESC`
    )
    .bind(startDate, endDate, startDate, endDate, startDate, endDate)
    .all();

  return (result.results as Record<string, unknown>[]).map((row) => {
    const sessions = (row.sessions as number) ?? 0;
    const leads = (row.leads as number) ?? 0;
    const contracts = (row.contracts as number) ?? 0;
    return {
      source: row.source as string,
      medium: row.medium as string,
      sessions,
      users: (row.users as number) ?? 0,
      leads,
      contracts,
      convRateLead: sessions > 0 ? (leads / sessions) * 100 : 0,
      convRateContract: sessions > 0 ? (contracts / sessions) * 100 : 0,
    };
  });
}

export interface UTMDimensionRow {
  value: string;
  sessions: number;
  leads: number;
  contracts: number;
  convRateLead: number;
  convRateContract: number;
}

type UTMDimension = 'campaign' | 'source' | 'medium' | 'content' | 'term';

/**
 * Returns sessions grouped by a specific UTM dimension with conversion counts.
 */
export async function queryByUTMDimension(
  db: D1Database,
  startDate: string,
  endDate: string,
  dimension: UTMDimension
): Promise<UTMDimensionRow[]> {
  // Map dimension name to column name (same in both tables)
  const column = dimension;

  const result = await db
    .prepare(
      `SELECT
        s.value,
        s.sessions,
        COALESCE(l.leads, 0) AS leads,
        COALESCE(c.contracts, 0) AS contracts
      FROM (
        SELECT ${column} AS value, SUM(sessions) AS sessions
        FROM ga4_sessions
        WHERE date_ref >= ? AND date_ref <= ?
        GROUP BY ${column}
      ) s
      LEFT JOIN (
        SELECT ${column} AS value,
          CASE WHEN SUM(sessions_with_event) > 0 THEN SUM(sessions_with_event) ELSE SUM(event_count) END AS leads
        FROM ga4_conversions
        WHERE date_ref >= ? AND date_ref <= ? AND event_name = 'generate_lead'
        GROUP BY ${column}
      ) l ON s.value = l.value
      LEFT JOIN (
        SELECT ${column} AS value,
          CASE WHEN SUM(sessions_with_event) > 0 THEN SUM(sessions_with_event) ELSE SUM(event_count) END AS contracts
        FROM ga4_conversions
        WHERE date_ref >= ? AND date_ref <= ? AND event_name = 'purchase'
        GROUP BY ${column}
      ) c ON s.value = c.value
      ORDER BY s.sessions DESC`
    )
    .bind(startDate, endDate, startDate, endDate, startDate, endDate)
    .all();

  return (result.results as Record<string, unknown>[]).map((row) => {
    const sessions = (row.sessions as number) ?? 0;
    const leads = (row.leads as number) ?? 0;
    const contracts = (row.contracts as number) ?? 0;
    return {
      value: row.value as string,
      sessions,
      leads,
      contracts,
      convRateLead: sessions > 0 ? (leads / sessions) * 100 : 0,
      convRateContract: sessions > 0 ? (contracts / sessions) * 100 : 0,
    };
  });
}

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

/**
 * Returns funnel data: total sessions + event counts for each funnel step.
 * Rate is calculated vs total sessions.
 * stepConversions shows conversion rate between consecutive steps.
 */
export async function queryFunnel(
  db: D1Database,
  startDate: string,
  endDate: string
): Promise<FunnelData> {
  const sessionsQuery = db
    .prepare(
      `SELECT COALESCE(SUM(sessions), 0) AS total
      FROM ga4_daily_totals
      WHERE date_ref >= ? AND date_ref <= ?`
    )
    .bind(startDate, endDate);

  // Use keyEvents (sessions_with_event) when available, fallback to eventCount
  // for events not marked as key events in GA4
  const eventsQuery = db
    .prepare(
      `SELECT event_name,
        CASE WHEN SUM(sessions_with_event) > 0
          THEN SUM(sessions_with_event)
          ELSE SUM(event_count)
        END AS total
      FROM ga4_daily_conversions
      WHERE date_ref >= ? AND date_ref <= ?
        AND event_name IN ('generate_lead', 'click_whatsapp', 'add_to_cart', 'begin_checkout', 'add_payment_info', 'purchase')
      GROUP BY event_name`
    )
    .bind(startDate, endDate);

  const [sessionsResult, eventsResult] = await db.batch([sessionsQuery, eventsQuery]);

  const totalSessions =
    ((sessionsResult.results[0] as Record<string, number>)?.total as number) ?? 0;

  // Build event counts map
  const eventCounts: Record<string, number> = {};
  for (const row of eventsResult.results as Record<string, unknown>[]) {
    eventCounts[row.event_name as string] = (row.total as number) ?? 0;
  }

  // Define funnel steps in order — click_whatsapp only shown if events exist
  const stepDefs: { name: string; event: string }[] = [
    { name: 'Visitantes', event: 'session' },
    { name: 'Leads', event: 'generate_lead' },
  ];

  // Add Click WhatsApp step after Leads only if there are click_whatsapp events
  if ((eventCounts['click_whatsapp'] ?? 0) > 0) {
    stepDefs.push({ name: 'Click WhatsApp', event: 'click_whatsapp' });
  }

  stepDefs.push(
    { name: 'Carrinho', event: 'add_to_cart' },
    { name: 'Checkout', event: 'begin_checkout' },
    { name: 'Pagamento', event: 'add_payment_info' },
    { name: 'Venda', event: 'purchase' },
  );

  const steps: FunnelStep[] = stepDefs.map((def) => {
    const count = def.event === 'session' ? totalSessions : (eventCounts[def.event] ?? 0);
    return {
      name: def.name,
      event: def.event,
      count,
      rate: totalSessions > 0 ? (count / totalSessions) * 100 : 0,
    };
  });

  // Calculate step-to-step conversions
  const stepConversions: StepConversion[] = [];
  for (let i = 0; i < steps.length - 1; i++) {
    const from = steps[i];
    const to = steps[i + 1];
    stepConversions.push({
      from: from.name,
      to: to.name,
      rate: from.count > 0 ? (to.count / from.count) * 100 : 0,
    });
  }

  return { steps, stepConversions };
}

export interface PageDataRow {
  pagePath: string;
  pageTitle: string;
  views: number;
  avgTimeOnPage: number;
  bounceRate: number;
}

export interface PaginatedPages {
  data: PageDataRow[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Returns paginated pages ordered by views DESC.
 * Aggregates across dates for the given range.
 */
export async function queryPages(
  db: D1Database,
  startDate: string,
  endDate: string,
  page = 1,
  pageSize = 20
): Promise<PaginatedPages> {
  const offset = (page - 1) * pageSize;

  const countResult = await db
    .prepare(
      `SELECT COUNT(DISTINCT page_path) AS total
      FROM ga4_pages
      WHERE date_ref >= ? AND date_ref <= ?`
    )
    .bind(startDate, endDate)
    .first<{ total: number }>();

  const total = countResult?.total ?? 0;

  const result = await db
    .prepare(
      `SELECT
        page_path AS pagePath,
        page_title AS pageTitle,
        SUM(screen_page_views) AS views,
        CASE WHEN SUM(screen_page_views) > 0
          THEN SUM(avg_time_on_page * screen_page_views) / SUM(screen_page_views)
          ELSE 0
        END AS avgTimeOnPage,
        CASE WHEN SUM(screen_page_views) > 0
          THEN SUM(bounce_rate * screen_page_views) / SUM(screen_page_views)
          ELSE 0
        END AS bounceRate
      FROM ga4_pages
      WHERE date_ref >= ? AND date_ref <= ?
      GROUP BY page_path
      ORDER BY views DESC
      LIMIT ? OFFSET ?`
    )
    .bind(startDate, endDate, pageSize, offset)
    .all();

  const data = (result.results as Record<string, unknown>[]).map((row) => ({
    pagePath: row.pagePath as string,
    pageTitle: (row.pageTitle as string) ?? '',
    views: (row.views as number) ?? 0,
    avgTimeOnPage: (row.avgTimeOnPage as number) ?? 0,
    bounceRate: ((row.bounceRate as number) ?? 0) * 100,
  }));

  return { data, total, page, pageSize };
}

// ── Insight Helpers ──

export interface InsightSummary {
  id: number;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface InsightFull extends InsightSummary {
  analysis: string;
}

/**
 * Returns list of insights without the analysis text, ordered by newest first.
 */
export async function queryInsightHistory(db: D1Database): Promise<InsightSummary[]> {
  const result = await db
    .prepare(
      `SELECT id, start_date AS startDate, end_date AS endDate, created_at AS createdAt
      FROM ai_insights
      ORDER BY created_at DESC`
    )
    .all();

  return result.results as unknown as InsightSummary[];
}

/**
 * Returns a single insight with full analysis text, or null if not found.
 */
export async function queryInsight(db: D1Database, id: number): Promise<InsightFull | null> {
  const result = await db
    .prepare(
      `SELECT id, start_date AS startDate, end_date AS endDate, analysis, created_at AS createdAt
      FROM ai_insights
      WHERE id = ?`
    )
    .bind(id)
    .first<InsightFull>();

  return result ?? null;
}

/**
 * Saves a new insight and returns its ID.
 */
export async function saveInsight(
  db: D1Database,
  startDate: string,
  endDate: string,
  analysis: string
): Promise<number> {
  const result = await db
    .prepare(
      `INSERT INTO ai_insights (start_date, end_date, analysis, created_at)
      VALUES (?, ?, ?, datetime('now'))
      RETURNING id`
    )
    .bind(startDate, endDate, analysis)
    .first<{ id: number }>();

  return result!.id;
}

// ── Page Conversion Sync & Query Helpers ──

/**
 * Upserts page conversion rows into ga4_page_conversions.
 * Batches in chunks of 100.
 */
export async function syncPageConversions(db: D1Database, rows: PageConversionRow[]): Promise<number> {
  if (rows.length === 0) return 0;

  const sql = `
    INSERT INTO ga4_page_conversions (
      date_ref, event_name, hostname, page_path, event_count, event_value
    ) VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT (date_ref, event_name, hostname, page_path)
    DO UPDATE SET
      event_count = excluded.event_count,
      event_value = excluded.event_value
  `;

  const chunks = chunkArray(rows, 100);
  for (const chunk of chunks) {
    const stmts = chunk.map((r) =>
      db.prepare(sql).bind(
        r.date,
        r.eventName,
        r.hostname,
        r.pagePath,
        r.eventCount,
        r.eventValue
      )
    );
    await db.batch(stmts);
  }

  return rows.length;
}

/**
 * Returns distinct page paths that have conversion events in the given period.
 * Excludes pages in the funnel_page_blocklist.
 */
export async function queryFunnelPages(
  db: D1Database,
  startDate: string,
  endDate: string
): Promise<string[]> {
  const result = await db
    .prepare(
      `SELECT DISTINCT page_path
      FROM ga4_page_conversions
      WHERE date_ref >= ? AND date_ref <= ?
        AND page_path NOT IN (SELECT page_path FROM funnel_page_blocklist)
      ORDER BY page_path`
    )
    .bind(startDate, endDate)
    .all();

  return (result.results as Record<string, unknown>[]).map(
    (row) => row.page_path as string
  );
}

/**
 * Returns all blocked page paths from the blocklist.
 */
export async function queryBlockedFunnelPages(db: D1Database): Promise<string[]> {
  const result = await db
    .prepare(`SELECT page_path FROM funnel_page_blocklist ORDER BY page_path`)
    .all();

  return (result.results as Record<string, unknown>[]).map(
    (row) => row.page_path as string
  );
}

/**
 * Updates the funnel page blocklist: inserts blocked pages and removes unblocked ones.
 * Batches in chunks of 100 for D1 limits.
 */
export async function updateBlockedFunnelPages(
  db: D1Database,
  blocked: string[],
  unblocked: string[]
): Promise<void> {
  const stmts: D1PreparedStatement[] = [];

  for (const path of blocked) {
    stmts.push(
      db
        .prepare(
          `INSERT INTO funnel_page_blocklist (page_path) VALUES (?)
          ON CONFLICT (page_path) DO NOTHING`
        )
        .bind(path)
    );
  }

  for (const path of unblocked) {
    stmts.push(
      db
        .prepare(`DELETE FROM funnel_page_blocklist WHERE page_path = ?`)
        .bind(path)
    );
  }

  if (stmts.length === 0) return;

  const chunks = chunkArray(stmts, 100);
  for (const chunk of chunks) {
    await db.batch(chunk);
  }
}

/**
 * Returns funnel data filtered by page path and/or hostname.
 * If hostname is provided, filters by hostname (domain-level funnel).
 * If pagePath is provided, filters by page path prefix.
 * If neither is provided, falls back to the global queryFunnel logic.
 */
export async function queryPageFunnel(
  db: D1Database,
  startDate: string,
  endDate: string,
  pagePath?: string,
  hostname?: string
): Promise<FunnelData> {
  // No filter — use the global funnel
  if ((!pagePath || pagePath === 'all') && !hostname) {
    return queryFunnel(db, startDate, endDate);
  }

  // Build WHERE clauses based on filters
  const visitorsWhere: string[] = ['date_ref >= ?', 'date_ref <= ?'];
  const visitorsBinds: (string)[] = [startDate, endDate];
  const eventsWhere: string[] = ['date_ref >= ?', 'date_ref <= ?'];
  const eventsBinds: (string)[] = [startDate, endDate];

  if (hostname) {
    visitorsWhere.push('hostname = ?');
    visitorsBinds.push(hostname);
    eventsWhere.push('hostname = ?');
    eventsBinds.push(hostname);
  }

  if (pagePath && pagePath !== 'all') {
    const likePattern = pagePath + '%';
    visitorsWhere.push('page_path LIKE ?');
    visitorsBinds.push(likePattern);
    eventsWhere.push('page_path LIKE ?');
    eventsBinds.push(likePattern);
  }

  // Get page visitors (screen_page_views) from ga4_pages
  const visitorsQuery = db
    .prepare(
      `SELECT COALESCE(SUM(screen_page_views), 0) AS total
      FROM ga4_pages
      WHERE ${visitorsWhere.join(' AND ')}`
    )
    .bind(...visitorsBinds);

  // Get conversion events
  const eventsQuery = db
    .prepare(
      `SELECT event_name, SUM(event_count) AS total
      FROM ga4_page_conversions
      WHERE ${eventsWhere.join(' AND ')}
      GROUP BY event_name`
    )
    .bind(...eventsBinds);

  const [visitorsResult, eventsResult] = await db.batch([visitorsQuery, eventsQuery]);

  const totalVisitors =
    ((visitorsResult.results[0] as Record<string, number>)?.total as number) ?? 0;

  // Build event counts map
  const eventCounts: Record<string, number> = {};
  for (const row of eventsResult.results as Record<string, unknown>[]) {
    eventCounts[row.event_name as string] = (row.total as number) ?? 0;
  }

  // All possible funnel steps mapped by event name
  const allStepDefs: { name: string; event: string }[] = [
    { name: 'Leads', event: 'generate_lead' },
    { name: 'Click WhatsApp', event: 'click_whatsapp' },
    { name: 'Carrinho', event: 'add_to_cart' },
    { name: 'Checkout', event: 'begin_checkout' },
    { name: 'Pagamento', event: 'add_payment_info' },
    { name: 'Venda', event: 'purchase' },
  ];

  // Only include steps that have events for this page
  const activeStepDefs = allStepDefs.filter(
    (def) => (eventCounts[def.event] ?? 0) > 0
  );

  // Always start with Visitantes
  const steps: FunnelStep[] = [
    {
      name: 'Visitantes',
      event: 'page_view',
      count: totalVisitors,
      rate: 100.0,
    },
  ];

  // Add active conversion steps
  for (const def of activeStepDefs) {
    const count = eventCounts[def.event] ?? 0;
    steps.push({
      name: def.name,
      event: def.event,
      count,
      rate: totalVisitors > 0 ? (count / totalVisitors) * 100 : 0,
    });
  }

  // Calculate step-to-step conversions
  const stepConversions: StepConversion[] = [];
  for (let i = 0; i < steps.length - 1; i++) {
    const from = steps[i];
    const to = steps[i + 1];
    stepConversions.push({
      from: from.name,
      to: to.name,
      rate: from.count > 0 ? (to.count / from.count) * 100 : 0,
    });
  }

  return { steps, stepConversions };
}

// ── Onboarding Steps Sync & Query ──

/**
 * Upserts onboarding step rows into ga4_onboarding_steps.
 * Batches in chunks of 100.
 */
export async function syncOnboardingSteps(db: D1Database, rows: OnboardingStepRow[]): Promise<number> {
  if (rows.length === 0) return 0;

  const sql = `
    INSERT INTO ga4_onboarding_steps (
      date_ref, step_number, step_name, event_count, users
    ) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT (date_ref, step_number)
    DO UPDATE SET
      step_name = excluded.step_name,
      event_count = excluded.event_count,
      users = excluded.users
  `;

  const chunks = chunkArray(rows, 100);
  for (const chunk of chunks) {
    const stmts = chunk.map((r) =>
      db.prepare(sql).bind(
        r.date,
        r.stepNumber,
        r.stepName,
        r.eventCount,
        r.users
      )
    );
    await db.batch(stmts);
  }

  return rows.length;
}

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
}

/**
 * Returns onboarding funnel data aggregated by step_number for the given date range.
 * rate = users / step1Users * 100
 * stepRate = users / prevStepUsers * 100
 */
export async function queryOnboardingFunnel(
  db: D1Database,
  startDate: string,
  endDate: string
): Promise<OnboardingFunnelData> {
  const result = await db
    .prepare(
      `SELECT
        step_number,
        step_name,
        SUM(event_count) AS event_count,
        SUM(users) AS users
      FROM ga4_onboarding_steps
      WHERE date_ref >= ? AND date_ref <= ?
      GROUP BY step_number
      ORDER BY step_number ASC`
    )
    .bind(startDate, endDate)
    .all();

  const rawSteps = (result.results as Record<string, unknown>[]).map((row) => ({
    stepNumber: (row.step_number as number) ?? 0,
    stepName: (row.step_name as string) ?? '',
    eventCount: (row.event_count as number) ?? 0,
    users: (row.users as number) ?? 0,
  }));

  const totalStep1Users = rawSteps.length > 0 ? rawSteps[0].users : 0;

  const steps: OnboardingStep[] = rawSteps.map((step, i) => ({
    stepNumber: step.stepNumber,
    stepName: step.stepName,
    users: step.users,
    eventCount: step.eventCount,
    rate: totalStep1Users > 0 ? (step.users / totalStep1Users) * 100 : 0,
    stepRate: i === 0
      ? 100
      : rawSteps[i - 1].users > 0
        ? (step.users / rawSteps[i - 1].users) * 100
        : 0,
  }));

  return { steps, totalStep1Users };
}

// ── Internal Helpers ──

/**
 * Splits an array into chunks of the given size.
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
