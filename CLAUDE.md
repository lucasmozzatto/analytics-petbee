# CLAUDE.md — GA4 Dashboard (Cloudflare Workers + D1)

## O que é este projeto

Dashboard de relatórios Google Analytics 4 da **Petbee** (insurtech de saúde pet) construído com React + TypeScript + Vite, hospedado 100% no Cloudflare (Workers + Static Assets + D1). Sem login, sem banco externo, sem servidor próprio. Os dados vêm da GA4 Data API, são armazenados no D1 (SQLite na edge) e consumidos pelo frontend via endpoints `/api/*`. Inclui análise automatizada por IA (Claude) que gera insights sobre tráfego, UTMs e conversões.

---

## Stack

```
Frontend:  React 19 + TypeScript + Vite 7
Styling:   Tailwind CSS v4 + CSS custom properties
Charts:    Recharts (requer dep react-is)
Routing:   React Router v7
Datas:     date-fns + date-fns-tz
Backend:   Cloudflare Workers + Static Assets (entry point único: worker.ts)
Database:  Cloudflare D1 (SQLite)
APIs:      GA4 Data API v1beta + Google Service Account (JWT) + Anthropic Claude API
Config:    wrangler.toml (obrigatório para deploy)
```

### Observações de compatibilidade

- **Vite 7 (não 8):** O `@tailwindcss/vite` suporta apenas Vite `^5.2 || ^6 || ^7`. Não fazer upgrade para Vite 8 até que o Tailwind suporte.
- **react-is:** O Recharts depende de `react-is` mas não o lista como dep. Deve estar no `package.json` explicitamente.
- **.npmrc:** Contém `legacy-peer-deps=true` para resolver conflitos de peer deps no build do Cloudflare.
- **Google Auth:** A GA4 Data API exige autenticação via Service Account JWT. O Worker assina o JWT usando Web Crypto API (disponível no Workers runtime) — sem SDK do Google.

### IMPORTANTE: Workers, NÃO Pages

O Cloudflare Dashboard (desde ~2026) cria projetos como **Workers**, não mais como "Pages" clássico. Isso significa:

- O deploy usa `npx wrangler deploy` (não existe mais deploy automático de Pages)
- File-based routing (`functions/` directory) **NÃO funciona** sozinho — é necessário um `worker.ts` como entry point
- Configuração de assets, D1 e routing fica no `wrangler.toml`
- O campo **Deploy command** no dashboard é obrigatório (`npx wrangler deploy`)
- **NÃO existe** campo "Build output directory" na UI — isso é definido no `wrangler.toml` via `[assets] directory`

---

## Estrutura do Projeto

```
/
├── index.html
├── package.json
├── vite.config.ts
├── wrangler.toml                  # Config Workers: assets, D1 binding, routing
├── worker.ts                      # Entry point único — router de todas as rotas /api/*
├── .npmrc                         # legacy-peer-deps=true (necessário para build Cloudflare)
├── schema.sql                     # Schema D1 para referência
│
├── src/                           # Frontend (React SPA)
│   ├── main.tsx
│   ├── App.tsx                    # Router — sem auth
│   ├── index.css                  # Design system (CSS variables + Tailwind + animações)
│   ├── pages/
│   │   ├── Visao.tsx              # Visão geral: sessões, usuários, bounce rate, duração
│   │   ├── Trafego.tsx            # Tráfego por canal + fonte/mídia (source/medium)
│   │   ├── UTMs.tsx               # Análise de UTMs (campaign, source, medium, content, term)
│   │   ├── Funil.tsx              # Funil de conversão: visitantes → leads → contratos
│   │   ├── Paginas.tsx            # Top páginas: views, tempo, bounce, conversão
│   │   └── Insights.tsx           # Análise AI com Claude (gerar + histórico)
│   ├── components/
│   │   ├── Sidebar.tsx            # Nav: Visão Geral, Tráfego, UTMs, Funil, Páginas, Insights AI
│   │   ├── Layout.tsx             # Sidebar + <Outlet />
│   │   ├── KPICards.tsx           # Sessões, Usuários, Bounce Rate, Duração Média, Conversões
│   │   ├── TrafficChart.tsx       # Gráfico diário (múltiplas linhas: sessões, usuários)
│   │   ├── ChannelTable.tsx       # Tabela por canal (Organic, Paid, Direct, etc.)
│   │   ├── UTMTable.tsx           # Tabela por dimensão UTM
│   │   ├── FunnelChart.tsx        # Funil visual (barras horizontais com %)
│   │   ├── PageTable.tsx          # Tabela por página
│   │   ├── SourceMediumTable.tsx  # Tabela source/medium
│   │   ├── TimeWindowPicker.tsx   # Seletor de período
│   │   ├── CompareToggle.tsx      # Toggle para comparar com período anterior
│   │   ├── DeltaBadge.tsx         # Badge de variação (↑ verde / ↓ vermelho)
│   │   └── Pagination.tsx         # Paginação reutilizável com page size
│   ├── hooks/
│   │   └── useGA4Data.ts
│   ├── lib/
│   │   ├── api.ts                 # fetch() wrapper para /api/*
│   │   └── format.ts              # Formatadores BRL, %, datas, duração
│   └── types/
│       └── index.ts
│
└── functions/                     # Libs do backend (importadas por worker.ts)
    └── lib/
        ├── d1.ts                  # Helper D1 (queryAll, queryFirst)
        ├── ga4-api.ts             # Chamadas GA4 Data API + extração de dimensões/métricas
        ├── google-auth.ts         # JWT signing para Service Account (Web Crypto API)
        ├── date-utils.ts          # Helpers timezone São Paulo
        └── types.ts               # Interface Env
```

### Sobre o diretório `functions/`

O `functions/` contém apenas **libs auxiliares** importadas pelo `worker.ts`. Toda a lógica de rotas está consolidada no `worker.ts` na raiz.

---

## Arquivos Críticos

### wrangler.toml

```toml
name = "ga4-dash"
main = "worker.ts"
compatibility_date = "2026-03-17"

[assets]
directory = "./dist"
not_found_handling = "single-page-application"
run_worker_first = ["/api/*"]

[[d1_databases]]
binding = "DB"
database_name = "ga4-dash-db"
database_id = "SEU_DATABASE_ID_AQUI"
```

- `main` — entry point do Worker (obrigatório)
- `[assets] directory` — onde ficam os arquivos estáticos após `npm run build`
- `not_found_handling = "single-page-application"` — serve `index.html` para rotas do React Router
- `run_worker_first = ["/api/*"]` — rotas `/api/*` vão para o Worker; o resto serve assets estáticos
- `[[d1_databases]]` — binding do D1 (o `database_id` vem do Cloudflare Dashboard)

### worker.ts

Entry point único que faz o routing de todas as rotas `/api/*`:

```
GET  /api/metrics/visao-geral          → KPIs gerais + série diária
GET  /api/metrics/trafego              → Sessões por canal + source/medium
GET  /api/metrics/utms                 → Análise por UTM (campaign, source, medium, content, term)
GET  /api/metrics/funil                → Etapas do funil de conversão (?variant= para A/B)
GET  /api/metrics/funil/pages          → Páginas com eventos de conversão
GET  /api/metrics/funil/sources        → Sources com lead counts para filtro
GET  /api/metrics/funil/variants       → Variantes A/B com pageviews, leads, conversão
GET  /api/metrics/paginas              → Top páginas por views/conversão
GET  /api/metrics/onboarding           → Funil de onboarding (steps 5-22)
GET  /api/metrics/dispositivos         → Sessões/conversões por device category
GET  /api/metrics/horarios             → Heatmap sessões por dia × hora
GET  /api/metrics/geografia            → Sessões por região/cidade
GET  /api/insights/history             → Lista de análises AI salvas (sem texto)
GET  /api/insights/:id                 → Análise AI completa por ID
POST /api/insights/analyze             → Gerar nova análise AI com Claude
GET  /api/config/funnel-pages          → Páginas com status blocked/unblocked
POST /api/config/funnel-pages          → Atualizar blocklist de páginas no funil
POST /api/sync/trigger                 → Sync GA4 API → D1 (protegido por Bearer token)
```

Importa helpers de `functions/lib/` (d1, ga4-api, google-auth, date-utils, types).

---

## Deploy — Passo a Passo Completo

### 1. Criar Service Account no Google Cloud

1. Google Cloud Console → **IAM & Admin** → **Service Accounts** → **Create**
2. Nome: `ga4-dashboard-reader`
3. Dar a role: **Viewer** (ou nenhuma — a permissão real é no GA4)
4. Criar e baixar chave JSON
5. No **Google Analytics Admin** → Propriedade GA4 → **Gerenciamento de usuários** → adicionar o e-mail da Service Account com papel de **Leitor**
6. Anotar o `private_key` e `client_email` do JSON da Service Account — serão adicionados como secrets no Cloudflare

### 2. Criar repositório GitHub

- Criar repo no GitHub **sem** template de `.gitignore`
- Push do código para o repo

### 3. Criar banco D1 no Cloudflare

1. Cloudflare Dashboard → **Workers & Pages** → **D1 SQL Database** → **Create** → nome: `ga4-dash-db`
2. **Anotar o Database ID** (UUID) — será usado no `wrangler.toml`
3. Na aba **Console** do D1, colar e executar todo o conteúdo de `schema.sql`

### 4. Atualizar wrangler.toml

Antes do primeiro deploy, editar `wrangler.toml` e substituir `SEU_DATABASE_ID_AQUI` pelo Database ID real. Commitar e fazer push.

### 5. Criar projeto Workers no Cloudflare

1. Cloudflare Dashboard → **Workers & Pages** → **Create** → Conectar ao repo GitHub
2. Selecionar o repositório
3. Configurações de build:
   - **Build command:** `npm run build`
   - **Deploy command:** `npx wrangler deploy`
   - **Path:** `/`
4. Clicar em **Deploy**

### 6. Configurar variáveis de ambiente (secrets)

Após o primeiro deploy:

1. Cloudflare Dashboard → seu projeto → **Settings** → **Variables and secrets**
2. Adicionar como **Secret** (tipo Encrypt):

| Variável              | O que é                                         | Exemplo                                                |
| --------------------- | ----------------------------------------------- | ------------------------------------------------------ |
| `GA4_PROPERTY_ID`     | ID numérico da propriedade GA4 (sem prefixo)    | `123456789`                                            |
| `GOOGLE_CLIENT_EMAIL` | E-mail da Service Account                       | `ga4-dashboard-reader@projeto.iam.gserviceaccount.com` |
| `GOOGLE_PRIVATE_KEY`  | Chave privada RSA da Service Account (com `\n`) | `-----BEGIN PRIVATE KEY-----\n...`                     |
| `SYNC_SECRET`         | Bearer token para proteger o endpoint sync      | Qualquer string aleatória                              |
| `ANTHROPIC_API_KEY`   | API key da Anthropic para análises AI           | `sk-ant-...`                                           |

3. Após adicionar, fazer **Retry deployment** para que o Worker pegue as variáveis.

> **Nota sobre `GOOGLE_PRIVATE_KEY`:** A chave vem do JSON com `\n` literais. No Cloudflare, colar o valor exatamente como aparece no JSON (incluindo os `\n`). O Worker deve fazer `.replace(/\\n/g, '\n')` ao usar a chave.

### 7. Backfill inicial de dados

A GA4 Data API tem limites de quota. Fazer backfill mês a mês:

```bash
# Ajustar SEU_DOMINIO e SEU_SECRET
curl -s -X POST "https://SEU_DOMINIO.workers.dev/api/sync/trigger?startDate=2025-01-01&endDate=2025-01-31" \
  -H "Authorization: Bearer SEU_SECRET"

curl -s -X POST "https://SEU_DOMINIO.workers.dev/api/sync/trigger?startDate=2025-02-01&endDate=2025-02-28" \
  -H "Authorization: Bearer SEU_SECRET"

# ... repetir mês a mês até o mês atual
```

Cada chamada deve retornar `{ "success": true, "synced": N }`. Executar um por vez.

### 8. Configurar cron automático

Usar [cron-job.org](https://cron-job.org) (gratuito):

- **URL:** `POST https://SEU_DOMINIO.workers.dev/api/sync/trigger`
- **Method:** POST
- **Header:** `Authorization: Bearer SEU_SECRET`
- **Schedule:** `0 4,20 * * *` (2x ao dia: 4h e 20h horário de Brasília)

O sync sem query params puxa automaticamente ontem + hoje (timezone São Paulo).

---

## Troubleshooting

### Build falha com "Missing entry-point to Worker script"

- O `wrangler.toml` precisa ter `main = "worker.ts"`. Deploy command deve ser `npx wrangler deploy`.

### Erro 403 na GA4 Data API

- A Service Account não tem acesso à propriedade. Verificar se foi adicionada no GA4 Admin com papel de Leitor.
- Verificar se `GA4_PROPERTY_ID` não tem o prefixo `properties/` (deve ser só o número).

### Erro JWT "invalid_grant"

- O `GOOGLE_PRIVATE_KEY` pode ter os `\n` mal formatados. Garantir que o Worker faz `.replace(/\\n/g, '\n')` antes de usar.
- O relógio do Worker deve estar sincronizado (é gerenciado pela Cloudflare, geralmente ok).

### GA4 retorna dados vazios para UTMs

- UTMs só são capturados se os links tiverem os parâmetros `utm_*` corretos. Verificar campanhas.
- Dimensões `sessionCampaignName`, `sessionSource`, `sessionMedium` — não `campaign`, `source`, `medium`.

### Erro 1101 no Cloudflare

- O Worker crashou. Verificar se o D1 binding está no `wrangler.toml` com o `database_id` correto e se o schema foi executado.

### Build falha com ERESOLVE peer deps

- O `.npmrc` com `legacy-peer-deps=true` resolve.

### Análise AI retorna erro 502

- Verificar se `ANTHROPIC_API_KEY` está configurada e se fez **Retry deployment**.

---

## Variáveis de Ambiente

ZERO segredos no código. Tudo fica no Cloudflare Dashboard → Settings → Variables and secrets.

| Variável              | O que é                                | Exemplo                            |
| --------------------- | -------------------------------------- | ---------------------------------- |
| `GA4_PROPERTY_ID`     | ID numérico da propriedade GA4         | `123456789`                        |
| `GOOGLE_CLIENT_EMAIL` | E-mail da Service Account              | `...@....iam.gserviceaccount.com`  |
| `GOOGLE_PRIVATE_KEY`  | Chave privada RSA (com `\n`)           | `-----BEGIN PRIVATE KEY-----\n...` |
| `SYNC_SECRET`         | Bearer token pro cron chamar /api/sync | String aleatória                   |
| `ANTHROPIC_API_KEY`   | API key da Anthropic (Claude)          | `sk-ant-...`                       |

O D1 é vinculado via `wrangler.toml`.

### Interface Env (functions/lib/types.ts)

```typescript
export interface Env {
  GA4_PROPERTY_ID: string;
  GOOGLE_CLIENT_EMAIL: string;
  GOOGLE_PRIVATE_KEY: string;
  SYNC_SECRET: string;
  ANTHROPIC_API_KEY: string;
  DB: D1Database;
}
```

### REGRA ABSOLUTA DE SEGURANÇA

- NUNCA colocar segredos em arquivos de código ou config
- NUNCA expor `GOOGLE_PRIVATE_KEY` ou `ANTHROPIC_API_KEY` no frontend
- NUNCA commitar `.env` ou `.dev.vars`
- O `database_id` no `wrangler.toml` NÃO é um segredo

---

## Design System

### Fontes

No `<head>` do `index.html`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300..700&family=JetBrains+Mono:wght@400;500;600&display=swap"
  rel="stylesheet"
/>
```

- **DM Sans** → todo texto de UI (body, labels, headings, nav)
- **JetBrains Mono** → todos os valores de dados (números, %, datas, botões de filtro)

### CSS Variables (src/index.css)

```css
@import "tailwindcss";

:root {
  /* Backgrounds */
  --bg: #0a0a0c;
  --surface: #121216;
  --surface-alt: #18181e;

  /* Borders */
  --border: #1f1f28;
  --border-light: #2a2a36;

  /* Text */
  --text: #e8e8ed;
  --text-dim: #7a7a8c;
  --text-muted: #4a4a58;

  /* Accent colors — paleta GA4 (verde/teal/azul, diferente do Meta Ads amber) */
  --accent: #10b981; /* emerald — cor primária GA4 */
  --accent-dim: rgba(16, 185, 129, 0.12);
  --teal: #14b8a6;
  --teal-dim: rgba(20, 184, 166, 0.12);
  --blue: #3b82f6;
  --blue-dim: rgba(59, 130, 246, 0.12);
  --amber: #f59e0b;
  --amber-dim: rgba(245, 158, 11, 0.12);
  --red: #ef4444;
  --red-dim: rgba(239, 68, 68, 0.12);
  --purple: #a855f7;
  --purple-dim: rgba(168, 85, 247, 0.12);
  --orange: #f97316;
  --orange-dim: rgba(249, 115, 22, 0.12);

  /* Layout */
  --sidebar-w: 220px;

  /* Font tokens */
  --mono: "JetBrains Mono", monospace;
  --sans: "DM Sans", -apple-system, BlinkMacSystemFont, sans-serif;
}

body {
  margin: 0;
  font-family: var(--sans);
  background: var(--bg);
  color: var(--text);
  -webkit-font-smoothing: antialiased;
}
```

### Cores por Métrica

| Métrica               | Token                |
| --------------------- | -------------------- |
| Sessões               | `--accent` (emerald) |
| Usuários              | `--teal`             |
| Bounce Rate           | `--red`              |
| Duração Média         | `--blue`             |
| Páginas/Sessão        | `--purple`           |
| Leads (generate_lead) | `--accent`           |
| Contratos (purchase)  | `--teal`             |
| Taxa de Conversão     | `--accent`           |
| Organic Search        | `--accent`           |
| Paid Search           | `--amber`            |
| Direct                | `--blue`             |
| Referral              | `--purple`           |
| Social                | `--orange`           |

### Padrões de Componentes

- **KPI Card:** bg `var(--surface)`, border `var(--border)`, rounded-xl, label uppercase text-xs `--text-muted`, value text-2xl font-bold font-mono, delta badge inline
- **Delta Badge (`DeltaBadge`):** `↑ +12,3%` em verde ou `↓ -5,1%` em vermelho, text-xs font-mono
- **Tabela:** bg `var(--surface)`, header text-xs uppercase `--text-muted`, hover `var(--surface-alt)`, células numéricas font-mono text-right, nomes truncados com `title` tooltip
- **Funil (`FunnelChart`):** barras horizontais com largura proporcional ao valor máximo, label da etapa + valor + % de conversão para próxima etapa
- **Pagination:** Seletor de page size + navegação de páginas, reutilizado em todas as tabelas
- **Botões de filtro:** font-mono 12px, ativo: bg `var(--surface-alt)` border `var(--border-light)`, inativo: transparente `--text-muted`
- **Charts (Recharts):** bg `var(--surface)`, grid strokeDasharray="3 3", axis fontSize 12 fontFamily mono, strokeWidth 2 dot false type monotone
- **Recharts Tooltip:** usar `formatter={(value: any) => ...}` e `labelFormatter={(label: any) => ...}` para evitar erros de tipo TS

### Animações

Usar classe `fade-up` para entrada escalonada de cards e linhas (translateY 12px → 0, opacity 0 → 1, delay incrementando 0.04s por item).

### Noise Texture

Overlay fractal noise em body::after com opacity 0.025, position fixed, pointer-events none, z-index 9999.

### Formatação pt-BR

```typescript
// lib/format.ts
export function formatNumber(value: number): string {
  return value.toLocaleString("pt-BR");
}

export function formatPercent(value: number, decimals = 2): string {
  return (
    value.toLocaleString("pt-BR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) + "%"
  );
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export function formatDateBR(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}
```

Todas as datas usam timezone `America/Sao_Paulo`.

---

## Banco de Dados (Cloudflare D1)

### Tabelas

#### ga4_sessions (tabela principal de tráfego diário)

Chave primária: `(date_ref, channel_group, source, medium, campaign, content, term)`.

Colunas: `date_ref TEXT`, `channel_group TEXT`, `source TEXT`, `medium TEXT`, `campaign TEXT`, `content TEXT`, `term TEXT`, `sessions INTEGER`, `users INTEGER`, `new_users INTEGER`, `bounce_rate REAL`, `avg_session_duration REAL`, `screen_page_views INTEGER`, `engaged_sessions INTEGER`

#### ga4_conversions (eventos de conversão diários por UTM)

Chave primária: `(date_ref, event_name, source, medium, campaign, content, term)`.

Colunas: `date_ref TEXT`, `event_name TEXT`, `source TEXT`, `medium TEXT`, `campaign TEXT`, `content TEXT`, `term TEXT`, `event_count INTEGER`, `sessions_with_event INTEGER`

Eventos relevantes para Petbee: `generate_lead`, `add_to_cart`, `begin_checkout`, `add_payment_info`, `purchase`

#### ga4_pages (top páginas diárias)

Chave primária: `(date_ref, page_path)`.

Colunas: `date_ref TEXT`, `page_path TEXT`, `page_title TEXT`, `screen_page_views INTEGER`, `unique_page_views INTEGER`, `avg_time_on_page REAL`, `bounce_rate REAL`, `exits INTEGER`

#### ga4_ab_variants (dados de teste A/B por variante)

Chave primária: `(date_ref, hostname, page_path, variant, event_name)`.

Colunas: `date_ref TEXT`, `hostname TEXT`, `page_path TEXT`, `variant TEXT`, `event_name TEXT`, `event_count INTEGER`

Eventos: `ab_variant_set` (proxy de pageview por variante) e `generate_lead` (conversão por variante).
Formato do variant: `<slug-da-lp>:<variante>` — ex: `pioracontece:A`, `pioracontece:B`.

Dados vêm da dimensão customizada `customEvent:ab_variant` do GA4 Data API.

#### ga4_account

Info da propriedade GA4. Colunas: `property_id TEXT PRIMARY KEY`, `display_name TEXT`, `time_zone TEXT`, `currency_code TEXT`, `updated_at TEXT`

#### ai_insights

Análises AI salvas. Colunas: `id INTEGER PRIMARY KEY AUTOINCREMENT`, `start_date TEXT`, `end_date TEXT`, `analysis TEXT`, `created_at TEXT`

### Padrões D1

- D1 é SQLite: usar `TEXT` em vez de `TIMESTAMPTZ`, `REAL` em vez de `DECIMAL`, `datetime('now')` em vez de `NOW()`
- Prepared statements com `.bind()` e `.all()` ou `.run()`
- Para inserts em massa usar `db.batch(stmts)` — limite de 100 statements por batch
- Upsert com `ON CONFLICT ... DO UPDATE SET`
- Group BY para agregar dados por dimensão no frontend

---

## Backend: worker.ts

### Arquitetura

O `worker.ts` é o **único entry point** do backend. Estrutura idêntica ao Meta Ads:

1. Recebe todas as requests que batem com `/api/*`
2. Faz routing manual por `pathname` e `method`
3. Importa helpers de `functions/lib/`
4. Retorna JSON em todas as respostas
5. Tem try/catch global que retorna erros como JSON

### Autenticação GA4 (functions/lib/google-auth.ts)

A GA4 Data API usa OAuth2 com Service Account. O Worker assina JWTs usando a **Web Crypto API** (disponível no Cloudflare Workers runtime — sem SDK do Google):

```typescript
// Fluxo:
// 1. Construir JWT com header + payload (iss, scope, aud, iat, exp)
// 2. Assinar com RSA-SHA256 usando a GOOGLE_PRIVATE_KEY (Web Crypto: importKey + sign)
// 3. POST para https://oauth2.googleapis.com/token para trocar JWT por access_token
// 4. Cachear o access_token em memória (válido por 1h) — sem state entre requests

// Scope necessário:
// https://www.googleapis.com/auth/analytics.readonly

// Audience do JWT:
// https://oauth2.googleapis.com/token
```

**IMPORTANTE:** A `GOOGLE_PRIVATE_KEY` vem do Cloudflare com `\n` literais. Fazer `.replace(/\\n/g, '\n')` antes de importar.

### GA4 Data API (functions/lib/ga4-api.ts)

A GA4 Data API v1beta recebe requests POST com dimensões e métricas:

```
POST https://analyticsdata.googleapis.com/v1beta/properties/{PROPERTY_ID}:runReport
Authorization: Bearer {access_token}
Content-Type: application/json
```

Body padrão:

```json
{
  "dateRanges": [{ "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD" }],
  "dimensions": [...],
  "metrics": [...],
  "limit": 10000,
  "offset": 0
}
```

Paginar usando `offset` enquanto `rows.length === limit`.

#### Dimensões disponíveis

| Dimensão GA4                 | O que representa                                  |
| ---------------------------- | ------------------------------------------------- |
| `date`                       | Data no formato `YYYYMMDD`                        |
| `sessionDefaultChannelGroup` | Canal (Organic Search, Paid Search, Direct, etc.) |
| `sessionSource`              | Source (google, facebook, etc.)                   |
| `sessionMedium`              | Medium (organic, cpc, email, etc.)                |
| `sessionCampaignName`        | Nome da campanha UTM                              |
| `sessionManualAdContent`     | UTM content                                       |
| `sessionManualTerm`          | UTM term                                          |
| `pagePath`                   | Caminho da página                                 |
| `pageTitle`                  | Título da página                                  |
| `hostName`                   | Hostname (lp.petbee.com.br, petbee.com.br, etc.)  |
| `eventName`                  | Nome do evento GA4                                |
| `deviceCategory`             | Categoria do device (mobile, desktop, tablet)      |
| `dayOfWeek`                  | Dia da semana (0=domingo)                          |
| `hour`                       | Hora do dia (0–23)                                 |
| `region`                     | Estado/região                                      |
| `city`                       | Cidade                                             |
| `customEvent:ab_variant`     | Variante A/B (ex: `pioracontece:A`)                |
| `customEvent:step_number`    | Step do onboarding (5–22)                          |
| `customEvent:step_name`      | Nome do step do onboarding                         |

#### Métricas disponíveis

| Métrica GA4              | O que representa                         |
| ------------------------ | ---------------------------------------- |
| `sessions`               | Total de sessões                         |
| `totalUsers`             | Usuários únicos                          |
| `newUsers`               | Novos usuários                           |
| `bounceRate`             | Taxa de rejeição (0–1)                   |
| `averageSessionDuration` | Duração média em segundos                |
| `screenPageViews`        | Visualizações de página                  |
| `engagedSessions`        | Sessões com engajamento                  |
| `eventCount`             | Total de eventos (filtrar por eventName) |
| `sessionsPerUser`        | Sessões por usuário                      |

#### Conversões (eventos-chave Petbee)

Para buscar contagem de eventos específicos, usar dimensão `eventName` + métrica `eventCount` + filtrar:

```json
{
  "dimensionFilter": {
    "filter": {
      "fieldName": "eventName",
      "inListFilter": {
        "values": [
          "generate_lead",
          "add_to_cart",
          "begin_checkout",
          "add_payment_info",
          "purchase"
        ]
      }
    }
  }
}
```

### Sync (POST /api/sync/trigger)

Protegido com `Authorization: Bearer {SYNC_SECRET}`:

1. Valida Bearer token
2. Obtém `access_token` do Google via JWT
3. Busca `startDate`/`endDate` dos query params (ou default: ontem + hoje em SP)
4. Em paralelo, faz 12 requests à GA4 Data API:
   - **Sessões por UTM:** dimensões `[date, sessionDefaultChannelGroup, sessionSource, sessionMedium, sessionCampaignName, sessionManualAdContent, sessionManualTerm]` + métricas de sessão
   - **Conversões por UTM:** dimensões `[date, eventName, sessionSource, sessionMedium, sessionCampaignName, sessionManualAdContent, sessionManualTerm]` + `eventCount`
   - **Top Páginas:** dimensões `[date, pagePath, pageTitle, hostName]` + métricas de página
   - **Page Conversions:** dimensões `[date, eventName, pagePath, hostName, sessionSource, sessionMedium]` + `eventCount`
   - **Daily Totals:** dimensão `[date]` + métricas de sessão (sem UTM breakdown)
   - **Daily Conversions:** dimensões `[date, eventName]` + `keyEvents`, `eventCount`
   - **Onboarding Steps:** dimensões `[date, customEvent:step_number, customEvent:step_name]` filtrado por `onboarding_step` + `direction=forward`
   - **Device Stats:** dimensões `[date, deviceCategory]` + métricas de sessão
   - **Device Conversions:** dimensões `[date, deviceCategory, eventName]` + `eventCount`
   - **Hourly Stats:** dimensões `[date, dayOfWeek, hour]` + sessões/users
   - **Geo Stats:** dimensões `[date, region, city]` + métricas de sessão
   - **A/B Variants:** dimensões `[date, hostName, pagePath, eventName, customEvent:ab_variant]` + `eventCount` — filtra `ab_variant_set` e `generate_lead` com variant `!= (not set)`
5. Upsert em D1 via `db.batch()` (chunks de 100)
6. Retorna `{ success, synced: { sessions, conversions, pages, pageConversions, dailyTotals, dailyConversions, onboardingSteps, deviceStats, deviceConversions, hourlyStats, geoStats, abVariants }, dateRange }`

---

## Agente de IA (Insights)

### Arquitetura

Idêntica ao Meta Ads. O endpoint `POST /api/insights/analyze` usa Claude Sonnet 4.5. O fluxo:

1. Frontend envia `{ startDate, endDate, systemPrompt?, userPrompt? }`
2. Worker consulta D1 em paralelo: KPIs, canais, UTMs, funil, top páginas
3. Consulta período anterior para variação
4. Monta tabelas markdown com métricas completas
5. Resolve placeholders no user prompt
6. Envia para Claude API (`claude-sonnet-4-6`, `max_tokens: 8192`)
7. Salva no D1 e retorna `{ id, analysis, createdAt }`

### Dados servidos ao agente

- **KPIs Gerais:** Sessões, Usuários, Novos Usuários, Bounce Rate, Duração Média, Páginas/Sessão, Leads, Contratos, Taxa Conversão Lead, Taxa Conversão Contrato
- **Canais:** Nome, Sessões, Usuários, Bounce Rate, Duração Média, Leads, Contratos, Taxa Conv.
- **Top UTM Campaigns:** Campanha, Source, Medium, Sessões, Leads, Contratos, CPL (se integrado com spend), CPA
- **Top Páginas:** Path, Views, Tempo Médio, Bounce Rate, Saídas
- **Funil:** Visitantes → Leads → Carrinhos → Checkouts → Contratos (com % de cada etapa)
- **Variação:** Sessões, Leads, Contratos vs período anterior

### Placeholders disponíveis no user prompt

| Placeholder            | Descrição                                               |
| ---------------------- | ------------------------------------------------------- |
| `{startDate}`          | Data início do período                                  |
| `{endDate}`            | Data fim do período                                     |
| `{n_dias}`             | Número de dias no período                               |
| `{var_sessoes}`        | Variação % das sessões vs período anterior              |
| `{var_leads}`          | Variação % dos leads vs período anterior                |
| `{var_contratos}`      | Variação % dos contratos vs período anterior            |
| `{var_bounce}`         | Variação % do bounce rate vs período anterior           |
| `{var_duracao}`        | Variação % da duração média vs período anterior         |
| `{tabela_kpis_gerais}` | KPIs agregados em markdown                              |
| `{tabela_canais}`      | Sessões/conversões por canal em markdown                |
| `{tabela_utms}`        | Top UTM campaigns em markdown                           |
| `{tabela_funil}`       | Etapas do funil em markdown                             |
| `{tabela_paginas}`     | Top páginas em markdown                                 |
| `{variacao_canais}`    | Tabela comparativa por canal vs período anterior        |
| `{variacao_utms}`      | Tabela comparativa por campanha UTM vs período anterior |

### System Prompt padrão

Contexto Petbee (insurtech de saúde pet), analista de Growth focado em tráfego e conversão:

- **Funil Petbee:** Landing page (generate_lead) → site principal (add_to_cart → begin_checkout → add_payment_info → purchase)
- **Benchmarks de referência:** Bounce rate landing < 60%, Duração média > 1m30s, Taxa lead-to-contrato > 8%, CTR orgânico > 3%
- **Canais:** Distinguir Organic Search, Paid Search (Google Ads), Paid Social (Meta Ads), Direct, Referral, Email
- **UTMs:** Identificar campanhas com melhor e pior taxa de conversão para contrato
- **Regra anti-descrição:** nunca descrever número sem interpretar
- **Acionar alertas** para: bounce rate alto em páginas de conversão, queda súbita de orgânico, campanhas UTM com alto volume mas zero conversão

---

## Endpoints da API (Backend → Frontend)

Todos recebem `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` como query params. Sem autenticação (exceto sync). Todos os endpoints suportam `?compare=true` para retornar dados do período anterior junto.

### GET /api/metrics/visao-geral

Retorna KPIs agregados + série diária:

```json
{
  "kpis": {
    "sessions": 12345,
    "users": 9876,
    "newUsers": 7654,
    "bounceRate": 52.3,
    "avgSessionDuration": 127.5,
    "pageViews": 34567,
    "leads": 234,
    "contracts": 45,
    "convRateLead": 1.90,
    "convRateContract": 0.36
  },
  "timeseries": [{ "date": "2026-03-15", "sessions": 412, "users": 334 }],
  "previous": { ... } // se ?compare=true
}
```

### GET /api/metrics/trafego

Retorna sessões por canal + source/medium:

```json
{
  "byChannel": [{ "channel": "Organic Search", "sessions": 5432, "users": 4321, "bounceRate": 48.2, "leads": 123, "contracts": 23 }],
  "bySourceMedium": [{ "source": "google", "medium": "organic", "sessions": 4567, ... }]
}
```

### GET /api/metrics/utms

Retorna análise por dimensão UTM. Query param `?dimension=campaign|source|medium|content|term`:

```json
[
  {
    "value": "nome-da-campanha",
    "sessions": 1234,
    "leads": 45,
    "contracts": 8,
    "convRateLead": 3.65,
    "convRateContract": 0.65
  }
]
```

### GET /api/metrics/funil

Query params: `?page=&hostname=&source=&variant=&compare=true`

Quando `variant` é passado, usa `queryABFunnel` que retorna funil filtrado pela variante A/B (anchor = `ab_variant_set` count).

Retorna etapas do funil de conversão:

```json
{
  "steps": [
    { "name": "Visitantes", "event": "session", "count": 12345, "rate": 100.0 },
    { "name": "Leads", "event": "generate_lead", "count": 234, "rate": 1.90 },
    { "name": "Carrinho", "event": "add_to_cart", "count": 189, "rate": 1.53 },
    { "name": "Checkout", "event": "begin_checkout", "count": 156, "rate": 1.26 },
    { "name": "Pagamento", "event": "add_payment_info", "count": 89, "rate": 0.72 },
    { "name": "Contrato", "event": "purchase", "count": 45, "rate": 0.36 }
  ],
  "stepConversions": [
    { "from": "Visitantes", "to": "Leads", "rate": 1.90 },
    { "from": "Leads", "to": "Carrinho", "rate": 80.77 },
    ...
  ],
  "funnels": [...] // apenas para website (petbee.com.br): múltiplos funis
}

```

### GET /api/metrics/funil/variants

Query params: `?hostname=&page=`

Retorna variantes A/B com métricas de comparação:

```json
{
  "variants": [
    { "variant": "pioracontece:A", "pageviews": 1234, "leads": 45, "convRate": 3.65 },
    { "variant": "pioracontece:B", "pageviews": 1198, "leads": 62, "convRate": 5.18 }
  ]
}
```

### GET /api/metrics/paginas

Retorna top páginas:

```json
[
  {
    "pagePath": "/planos",
    "pageTitle": "Planos Petbee",
    "views": 4567,
    "uniqueViews": 3456,
    "avgTimeOnPage": 95.3,
    "bounceRate": 42.1,
    "exits": 789
  }
]
```

Ordenado por views DESC. Paginado (query params `?page=1&pageSize=20`).

### POST /api/insights/analyze

Body: `{ startDate, endDate, systemPrompt?, userPrompt? }`
Retorna: `{ id, analysis, createdAt }`

### GET /api/insights/history

Retorna: `[{ id, startDate, endDate, createdAt }]` — ordenado por createdAt DESC.

### GET /api/insights/:id

Retorna: `{ id, startDate, endDate, analysis, createdAt }` — ou 404.

### POST /api/sync/trigger

Protegido com Bearer token.
Retorna: `{ success, synced: { sessions, conversions, pages }, dateRange }`

---

## Páginas do Frontend

### 1. Visão Geral (/visao-geral)

Layout:

- Badge com nome da propriedade GA4
- Título "Visão Geral" + subtítulo "Analytics da Petbee"
- TimeWindowPicker: `Hoje | Ontem | 7 dias | 14 dias | 30 dias | Este mês | Mês passado`
- Toggle "Comparar com período anterior" → DeltaBadges nos KPI cards
- 5 KPI Cards: Sessões, Usuários, Bounce Rate, Duração Média, Leads (com delta vs período anterior)
- Gráfico diário (2 linhas: sessões em emerald, usuários em teal, ~200px altura)
- Mini cards de canal (Organic / Paid / Direct / Social — top 4) com sessões + % do total

### 2. Tráfego (/trafego)

Layout:

- TimeWindowPicker + toggle comparar
- Tabela por canal (Channel Group): Canal, Sessões, Usuários, Bounce Rate, Duração Média, Leads, Contratos, Taxa Conv. Lead, Taxa Conv. Contrato
- Tabela Source/Medium: Source, Medium, Sessões, Usuários, Leads, Contratos, Taxa Conv.
- Ambas com DeltaBadge nas métricas principais quando comparação ativa

### 3. UTMs (/utms)

Layout:

- TimeWindowPicker
- Tabs: `Campanha | Source | Medium | Content | Term`
- Tabela da dimensão selecionada: Valor, Sessões, Leads, Contratos, Taxa Conv. Lead, Taxa Conv. Contrato
- Highlight em linha com melhor taxa de conversão para contrato (verde suave)
- Highlight em linha com maior volume mas < 0,1% conversão (vermelho suave) — campanhas desperdiçadoras

### 4. Funil (/funil)

Layout:

- TimeWindowPicker + toggle comparar
- **Domain tabs:** Todas | Landing Pages (`lp.petbee.com.br`) | Website (`petbee.com.br`)
- **Filtro por página:** quando domínio selecionado, mostra páginas com eventos de conversão
- **Filtro por origem:** sources com badge de leads
- **Teste A/B (LP only):** quando LP selecionada e existem variantes A/B:
  - Cards lado a lado com Variante A vs B: pageviews, leads, conversão
  - Badge WINNER na variante com maior conversão
  - Delta percentual entre variantes
  - Click num card filtra o funil para aquela variante
- FunnelChart: barras trapezoidais escalonadas (cada etapa mais estreita), com:
  - KPI summary cards (Entrada, Saída, Conversão Total, Maior Perda)
  - Nome da etapa + evento GA4
  - Valor absoluto (font-mono)
  - Taxa vs total de sessões
  - Taxa vs etapa anterior (entre barras)
- **Website:** 3 funis separados (Pricing, WhatsApp, Quiz/Simulador)
- Tabela de drop-off: entre quais etapas perde-se mais usuários

### 5. Páginas (/paginas)

Layout:

- TimeWindowPicker
- Tabela com paginação: Página, Título, Views, Views Únicas, Tempo Médio, Bounce Rate, Saídas
- Filtro por prefix de URL (ex: `/planos`, `/sobre`)
- Células de Bounce Rate coloridas: < 40% verde, 40–60% amber, > 60% vermelho

### 6. Insights AI (/insights)

Layout idêntico ao Meta Ads:

- TimeWindowPicker para selecionar período
- Seção colapsável "Configurar Prompts"
- Botão "Gerar Análise"
- Resultado em markdown
- Histórico de análises salvas

### Sidebar

```
[G] Propriedade GA4
    GA4 Dashboard
─────────────────
ANALYTICS
  ◉ Visão Geral
  ⇅ Tráfego
  # UTMs
  ▽ Funil
  ≡ Páginas
─────────────────
  ✦ Insights AI
─────────────────
Google Analytics 4
```

### Router (src/App.tsx)

```tsx
<BrowserRouter>
  <Routes>
    <Route element={<Layout />}>
      <Route path="/" element={<Navigate to="/visao-geral" />} />
      <Route path="/visao-geral" element={<Visao />} />
      <Route path="/trafego" element={<Trafego />} />
      <Route path="/utms" element={<UTMs />} />
      <Route path="/funil" element={<Funil />} />
      <Route path="/paginas" element={<Paginas />} />
      <Route path="/insights" element={<Insights />} />
    </Route>
  </Routes>
</BrowserRouter>
```

---

## Fluxo de Dados Completo

```
cron-job.org (2x ao dia: 4h, 20h)
    │
    POST /api/sync/trigger + Bearer SYNC_SECRET
    │
    ▼
Cloudflare Worker (worker.ts)
    │
    ├── GOOGLE_CLIENT_EMAIL + GOOGLE_PRIVATE_KEY → JWT → OAuth Token
    │       └──► GA4 Data API (fetch sessions + conversions + pages)
    ├── env.ANTHROPIC_API_KEY ──► Anthropic Claude API (análises AI)
    ├── env.DB (D1 binding) ──► D1 SQLite (write/upsert)
    │
    /api/metrics/* ◄── Frontend React (read, sem auth)
    /api/insights/* ◄── Frontend React (read/write análises AI)
    │
    ▼
React SPA (Cloudflare Static Assets)
    fetch('/api/metrics/visao-geral?startDate=...&endDate=...')
    fetch('/api/insights/analyze', { method: 'POST', body: ... })
    Renderiza: KPIs, gráfico, tabelas, funil, Insights AI
```

**Nenhum segredo toca o frontend.** O SPA só chama `/api/*`. Toda comunicação com a GA4 API e Anthropic API é server-side.

---

## Tracking de Testes A/B nas Landing Pages

### Arquitetura

O tracking de A/B é implementado no dataLayer das LPs e processado via GTM → GA4 → Dashboard.

**Eventos no dataLayer:**

1. **`ab_variant_set`** — dispara no carregamento de qualquer LP com teste A/B ativo
   - Payload: `{ event: "ab_variant_set", ab_variant: "pioracontece:A" }`
2. **`generate_lead`** — dispara no submit do formulário, já inclui campo `variant`

**Formato do valor:** `<slug-da-lp>:<variante>` — ex: `pioracontece:A`, `pioracontece:B`

### Configuração GTM/GA4 (já feita)

1. **Variável GTM:** Data Layer Variable → `ab_variant`
2. **Custom Dimension GA4:** "AB Variant" vinculada ao parâmetro `ab_variant` (event-scoped)
3. **Tag GTM:** GA4 Event para `ab_variant_set` enviando parâmetro `ab_variant`

### Fluxo de dados no Dashboard

```
LP dataLayer → GTM → GA4 (customEvent:ab_variant)
                           ↓
              Sync (fetchABVariants) → ga4_ab_variants (D1)
                           ↓
              /api/metrics/funil/variants → Frontend (cards A vs B)
              /api/metrics/funil?variant= → Frontend (funil filtrado)
```

### Funções backend

- **`fetchABVariants()`** (ga4-api.ts) — busca GA4 com dimensão `customEvent:ab_variant`, filtra `(not set)`
- **`syncABVariants()`** (d1.ts) — upsert no D1
- **`queryABVariants()`** (d1.ts) — retorna variantes com pageviews, leads, convRate agrupados
- **`queryABFunnel()`** (d1.ts) — funil filtrado por variante (anchor = `ab_variant_set`)

### LP ativa com A/B

- `/pioracontece` — 50% variante A / 50% variante B
- Escalável: qualquer LP nova com A/B já envia automaticamente, sem mexer no GTM

---

## Regras para o Claude Code

- Sempre usar TypeScript — nunca JS puro
- Todas as datas em `America/Sao_Paulo` timezone
- Font mono (JetBrains Mono) para TODOS os valores numéricos
- Font sans (DM Sans) para TODOS os textos de interface
- Seguir o design system dark mode com paleta emerald/teal (diferente do Meta Ads amber)
- Componentizar tudo — cada card, tabela, chart é seu próprio componente
- Backend: toda lógica de rotas no `worker.ts` usando `ExportedHandler<Env>`
- Banco: queries D1 com prepared statements e `.bind()`
- NUNCA expor tokens no frontend (`GOOGLE_PRIVATE_KEY`, `ANTHROPIC_API_KEY`)
- Upsert com `ON CONFLICT DO UPDATE` para idempotência
- Paginar chamadas à GA4 Data API usando `offset` enquanto `rows.length === limit`
- JWT para GA4 assinado com Web Crypto API — sem SDK do Google no Worker
- GOOGLE_PRIVATE_KEY: sempre fazer `.replace(/\\n/g, '\n')` antes de usar
- Manter Vite na v7 até Tailwind suportar v8
- Manter `.npmrc` com `legacy-peer-deps=true`
- Manter `wrangler.toml` com `main`, `[assets]` e `[[d1_databases]]`
- Deploy command no Cloudflare deve ser `npx wrangler deploy`
- Backfill da GA4 API deve ser feito mês a mês
- Tabelas com nomes truncados devem ter `title` attribute para tooltip
- Bounce rate exibido como % (multiplicar por 100 se a GA4 retornar 0–1)
- Duração de sessão exibida como `Xm YYs` usando `formatDuration()`
- Funil sempre mostra taxa vs sessões totais E taxa step-to-step
- DeltaBadge: verde para melhora (mais sessões, mais leads, menos bounce), vermelho para piora
- UTMs com `(not set)` devem ser exibidos como `—` na UI
- Análises AI filtram `sessions > 0` para reduzir ruído
- Taxa de conversão calculada server-side — nunca delegar ao LLM
