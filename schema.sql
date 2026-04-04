-- GA4 Sessions (tráfego diário por UTM)
CREATE TABLE IF NOT EXISTS ga4_sessions (
  date_ref TEXT NOT NULL,
  channel_group TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT '',
  medium TEXT NOT NULL DEFAULT '',
  campaign TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  term TEXT NOT NULL DEFAULT '',
  sessions INTEGER NOT NULL DEFAULT 0,
  users INTEGER NOT NULL DEFAULT 0,
  new_users INTEGER NOT NULL DEFAULT 0,
  bounce_rate REAL NOT NULL DEFAULT 0,
  avg_session_duration REAL NOT NULL DEFAULT 0,
  screen_page_views INTEGER NOT NULL DEFAULT 0,
  engaged_sessions INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (date_ref, channel_group, source, medium, campaign, content, term)
);

-- GA4 Conversions (eventos de conversão diários por UTM)
CREATE TABLE IF NOT EXISTS ga4_conversions (
  date_ref TEXT NOT NULL,
  event_name TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT '',
  medium TEXT NOT NULL DEFAULT '',
  campaign TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  term TEXT NOT NULL DEFAULT '',
  event_count INTEGER NOT NULL DEFAULT 0,
  sessions_with_event INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (date_ref, event_name, source, medium, campaign, content, term)
);

-- GA4 Pages (top páginas diárias por hostname)
CREATE TABLE IF NOT EXISTS ga4_pages (
  date_ref TEXT NOT NULL,
  hostname TEXT NOT NULL DEFAULT '',
  page_path TEXT NOT NULL,
  page_title TEXT NOT NULL DEFAULT '',
  screen_page_views INTEGER NOT NULL DEFAULT 0,
  unique_page_views INTEGER NOT NULL DEFAULT 0,
  avg_time_on_page REAL NOT NULL DEFAULT 0,
  bounce_rate REAL NOT NULL DEFAULT 0,
  exits INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (date_ref, hostname, page_path)
);

-- GA4 Page Conversions (eventos de conversão diários por hostname + página + source/medium)
CREATE TABLE IF NOT EXISTS ga4_page_conversions (
  date_ref TEXT NOT NULL,
  event_name TEXT NOT NULL,
  hostname TEXT NOT NULL DEFAULT '',
  page_path TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT '',
  medium TEXT NOT NULL DEFAULT '',
  event_count INTEGER NOT NULL DEFAULT 0,
  event_value REAL NOT NULL DEFAULT 0,
  PRIMARY KEY (date_ref, event_name, hostname, page_path, source, medium)
);

-- GA4 Daily Totals (agregado sem breakdown UTM — usuários deduplicated)
CREATE TABLE IF NOT EXISTS ga4_daily_totals (
  date_ref TEXT PRIMARY KEY,
  sessions INTEGER NOT NULL DEFAULT 0,
  users INTEGER NOT NULL DEFAULT 0,
  new_users INTEGER NOT NULL DEFAULT 0,
  bounce_rate REAL NOT NULL DEFAULT 0,
  avg_session_duration REAL NOT NULL DEFAULT 0,
  screen_page_views INTEGER NOT NULL DEFAULT 0,
  engaged_sessions INTEGER NOT NULL DEFAULT 0
);

-- GA4 Daily Conversions (agregado sem UTM — contagem precisa por sessão)
CREATE TABLE IF NOT EXISTS ga4_daily_conversions (
  date_ref TEXT NOT NULL,
  event_name TEXT NOT NULL,
  sessions_with_event INTEGER NOT NULL DEFAULT 0,
  event_count INTEGER NOT NULL DEFAULT 0,
  event_value REAL NOT NULL DEFAULT 0,
  PRIMARY KEY (date_ref, event_name)
);

-- GA4 Account info
CREATE TABLE IF NOT EXISTS ga4_account (
  property_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL DEFAULT '',
  time_zone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  currency_code TEXT NOT NULL DEFAULT 'BRL',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- AI Insights
CREATE TABLE IF NOT EXISTS ai_insights (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  analysis TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Funnel Page Blocklist (hidden pages in funnel page selector)
CREATE TABLE IF NOT EXISTS funnel_page_blocklist (
  page_path TEXT PRIMARY KEY,
  blocked_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- GA4 Onboarding Steps (onboarding_step events by step_number)
CREATE TABLE IF NOT EXISTS ga4_onboarding_steps (
  date_ref TEXT NOT NULL,
  step_number INTEGER NOT NULL,
  step_name TEXT NOT NULL DEFAULT '',
  event_count INTEGER NOT NULL DEFAULT 0,
  users INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (date_ref, step_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_date ON ga4_sessions(date_ref);
CREATE INDEX IF NOT EXISTS idx_conversions_date ON ga4_conversions(date_ref);
CREATE INDEX IF NOT EXISTS idx_conversions_event ON ga4_conversions(event_name);
CREATE INDEX IF NOT EXISTS idx_pages_date ON ga4_pages(date_ref);
CREATE INDEX IF NOT EXISTS idx_pages_hostname ON ga4_pages(hostname);
CREATE INDEX IF NOT EXISTS idx_page_conversions_date ON ga4_page_conversions(date_ref);
CREATE INDEX IF NOT EXISTS idx_page_conversions_page ON ga4_page_conversions(page_path);
CREATE INDEX IF NOT EXISTS idx_page_conversions_hostname ON ga4_page_conversions(hostname);
CREATE INDEX IF NOT EXISTS idx_page_conversions_source ON ga4_page_conversions(source, medium);
CREATE INDEX IF NOT EXISTS idx_insights_created ON ai_insights(created_at);
CREATE INDEX IF NOT EXISTS idx_onboarding_date ON ga4_onboarding_steps(date_ref);
