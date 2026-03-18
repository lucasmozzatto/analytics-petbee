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

-- GA4 Pages (top páginas diárias)
CREATE TABLE IF NOT EXISTS ga4_pages (
  date_ref TEXT NOT NULL,
  page_path TEXT NOT NULL,
  page_title TEXT NOT NULL DEFAULT '',
  screen_page_views INTEGER NOT NULL DEFAULT 0,
  unique_page_views INTEGER NOT NULL DEFAULT 0,
  avg_time_on_page REAL NOT NULL DEFAULT 0,
  bounce_rate REAL NOT NULL DEFAULT 0,
  exits INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (date_ref, page_path)
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_date ON ga4_sessions(date_ref);
CREATE INDEX IF NOT EXISTS idx_conversions_date ON ga4_conversions(date_ref);
CREATE INDEX IF NOT EXISTS idx_conversions_event ON ga4_conversions(event_name);
CREATE INDEX IF NOT EXISTS idx_pages_date ON ga4_pages(date_ref);
CREATE INDEX IF NOT EXISTS idx_insights_created ON ai_insights(created_at);
