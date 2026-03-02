# Phase 1: Data Foundation — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Scaffold the Next.js project, create the Supabase schema, build the data sync pipeline, and seed 3 initial indicators (PIB, chômage, inflation) with real data from data.gouv.fr.

**Architecture:** Next.js 15 App Router monorepo. Supabase as data cache. Sync pipeline fetches CSV data from INSEE and Banque de France, transforms to our `indicators` format, upserts into Supabase. API routes expose data to the future 3D frontend.

**Tech Stack:** Next.js 15, TypeScript, Supabase JS, Vitest, Zustand, Tailwind CSS

**Supabase Project:** `aoaawfslehzopnqkyqwi` (region: eu-west-1, name: "Gouv")

---

## Data Source Discovery

The following was validated during exploration:

| Indicator | Source | Format | Notes |
|-----------|--------|--------|-------|
| PIB | INSEE Melodi API | ZIP containing CSV | resource `decbe31d-e28c-4f68-9127-d48c7d0a5155` |
| IPC (inflation) | INSEE Melodi API | ZIP containing CSV | resource `5961e778-380b-4098-9b7e-33697b44b3c6` |
| Chômage FR | Banque de France webstat | CSV per country | `SERIES_KEY=227.STS.M.FR.S.UNEH.RTT000.4.000` |
| Chômage DE | Banque de France webstat | CSV per country | `SERIES_KEY=227.STS.M.DE.S.UNEH.RTT000.4.000` |

**Important:** INSEE datasets on data.gouv.fr are external links to `api.insee.fr/melodi` (ZIP files). The data.gouv Tabular API does NOT work for these. The sync pipeline must fetch directly from source URLs.

**Strategy for Phase 1:**
1. Use the MCP `download_and_parse_resource` tool via Claude Code to explore data formats
2. Seed initial data into Supabase from exploration
3. Build automated fetchers for production sync

---

### Task 1: Scaffold Next.js project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `app/layout.tsx`, `app/page.tsx`

**Step 1: Initialize Next.js**

```bash
cd C:/Users/mayeu/gouv
npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --yes
```

Note: Use `--yes` to accept defaults. The `.` installs in current directory.

**Step 2: Install project dependencies**

```bash
npm install @supabase/supabase-js zustand recharts
npm install @react-three/fiber @react-three/drei @react-three/rapier three
npm install -D @types/three vitest @vitejs/plugin-react jsdom
```

**Step 3: Configure Vitest**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

**Step 4: Add test script to package.json**

Add to `scripts`: `"test": "vitest", "test:run": "vitest run"`

**Step 5: Configure Next.js for Three.js**

Update `next.config.ts`:

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['three'],
}

export default nextConfig
```

**Step 6: Verify project runs**

```bash
npm run dev
```

Expected: Server starts on http://localhost:3000

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js 15 project with R3F, Supabase, Vitest"
```

---

### Task 2: Configure environment variables

**Files:**
- Create: `.env.local`
- Modify: `.gitignore`

**Step 1: Create .env.local**

```env
NEXT_PUBLIC_SUPABASE_URL=https://aoaawfslehzopnqkyqwi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<get from Supabase dashboard or MCP get_publishable_keys>
CRON_SECRET=<generate a random string for cron auth>
```

**Step 2: Verify .gitignore includes .env.local**

Check that `.env.local` is in `.gitignore` (Next.js scaffold includes it by default).

**Step 3: No commit** (env file is gitignored)

---

### Task 3: Create Supabase schema

**Files:**
- (Applied via Supabase MCP `apply_migration`)

**Step 1: Apply migration via Supabase MCP**

Use `mcp__claude_ai_Supabase__apply_migration` with project_id `aoaawfslehzopnqkyqwi`:

```sql
-- indicators: time series data points
CREATE TABLE indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT,
  frequency TEXT NOT NULL,
  source_dataset_id TEXT,
  source_resource_id TEXT,
  country TEXT DEFAULT 'FR',
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(name, date, country)
);
CREATE INDEX idx_indicators_lookup ON indicators(name, country, date);

-- events: timeline of reforms and milestones
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  sources TEXT[],
  display_order INT
);

-- junction: events <-> indicators
CREATE TABLE event_indicators (
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  indicator_name TEXT NOT NULL,
  impact_description TEXT,
  PRIMARY KEY (event_id, indicator_name)
);

-- narratives: editorial analysis per indicator per period
CREATE TABLE narratives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  indicator_name TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  content_before TEXT,
  content_analysis TEXT,
  content_comparison TEXT,
  content_projection TEXT,
  generated_by TEXT DEFAULT 'human',
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(indicator_name, period_start, period_end)
);

-- projections: forward-looking scenarios
CREATE TABLE projections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  indicator_name TEXT NOT NULL,
  scenario TEXT,
  data_points JSONB,
  methodology TEXT,
  assumptions TEXT
);

-- sync_log: audit trail
CREATE TABLE sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id TEXT,
  resource_id TEXT,
  synced_at TIMESTAMPTZ DEFAULT now(),
  rows_updated INT,
  status TEXT,
  error_message TEXT
);
```

**Step 2: Verify tables exist**

Use `mcp__claude_ai_Supabase__list_tables` with project_id `aoaawfslehzopnqkyqwi`.

Expected: 6 tables (indicators, events, event_indicators, narratives, projections, sync_log)

**Step 3: Enable RLS with public read**

Apply second migration:

```sql
-- Enable RLS on all tables
ALTER TABLE indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE narratives ENABLE ROW LEVEL SECURITY;
ALTER TABLE projections ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;

-- Public read access (data is public)
CREATE POLICY "Public read indicators" ON indicators FOR SELECT USING (true);
CREATE POLICY "Public read events" ON events FOR SELECT USING (true);
CREATE POLICY "Public read event_indicators" ON event_indicators FOR SELECT USING (true);
CREATE POLICY "Public read narratives" ON narratives FOR SELECT USING (true);
CREATE POLICY "Public read projections" ON projections FOR SELECT USING (true);
CREATE POLICY "Public read sync_log" ON sync_log FOR SELECT USING (true);
```

---

### Task 4: Define TypeScript types

**Files:**
- Create: `types/database.ts`
- Create: `types/indicators.ts`
- Create: `types/events.ts`

**Step 1: Create types/database.ts**

```typescript
export type Category = 'economie' | 'emploi'
export type Frequency = 'monthly' | 'quarterly' | 'annual'
export type Country = 'FR' | 'DE' | 'PT' | 'SE' | 'UK' | 'ES' | 'IT'

export interface Indicator {
  id: string
  category: Category
  name: string
  date: string
  value: number
  unit: string | null
  frequency: Frequency
  source_dataset_id: string | null
  source_resource_id: string | null
  country: Country
  updated_at: string
}

export interface Event {
  id: string
  date: string
  title: string
  description: string | null
  category: string | null
  sources: string[] | null
  display_order: number | null
}

export interface EventIndicator {
  event_id: string
  indicator_name: string
  impact_description: string | null
}

export interface Narrative {
  id: string
  indicator_name: string
  period_start: string
  period_end: string
  content_before: string | null
  content_analysis: string | null
  content_comparison: string | null
  content_projection: string | null
  generated_by: 'human' | 'ai'
  updated_at: string
}

export interface Projection {
  id: string
  indicator_name: string
  scenario: string | null
  data_points: Array<{ date: string; value: number }> | null
  methodology: string | null
  assumptions: string | null
}

export interface SyncLog {
  id: string
  dataset_id: string | null
  resource_id: string | null
  synced_at: string
  rows_updated: number | null
  status: 'success' | 'error' | 'no_change'
  error_message: string | null
}
```

**Step 2: Create types/indicators.ts**

```typescript
export type IndicatorName =
  | 'pib'
  | 'dette_pib'
  | 'deficit_public'
  | 'chomage'
  | 'inflation_ipc'
  | 'smic'

export interface IndicatorConfig {
  name: IndicatorName
  label: string
  category: 'economie' | 'emploi'
  unit: string
  frequency: 'monthly' | 'quarterly' | 'annual'
  color: string
  description: string
  sourceUrl: string
  resourceId: string
  datasetId: string
}
```

**Step 3: Create types/events.ts**

```typescript
export type EventCategory =
  | 'fiscalite'
  | 'emploi'
  | 'crise'
  | 'reforme'
  | 'social'
  | 'international'

export interface TimelineEvent {
  date: string
  title: string
  description: string
  category: EventCategory
  indicatorNames: string[]
  sources: string[]
  displayOrder: number
}
```

**Step 4: Commit**

```bash
git add types/
git commit -m "feat: add TypeScript type definitions for database and domain"
```

---

### Task 5: Create indicator configuration and events seed data

**Files:**
- Create: `data/indicator-config.ts`
- Create: `data/events.ts`

**Step 1: Create data/indicator-config.ts**

```typescript
import { IndicatorConfig } from '@/types/indicators'

export const INDICATOR_CONFIGS: IndicatorConfig[] = [
  {
    name: 'pib',
    label: 'PIB (Produit Intérieur Brut)',
    category: 'economie',
    unit: 'Md€',
    frequency: 'quarterly',
    color: '#2563eb',
    description: 'Produit intérieur brut en volume, données trimestrielles',
    sourceUrl: 'https://api.insee.fr/melodi/file/DD_CNA_AGREGATS/DD_CNA_AGREGATS_CSV_FR',
    resourceId: 'decbe31d-e28c-4f68-9127-d48c7d0a5155',
    datasetId: '66685856500cccd9a7089112',
  },
  {
    name: 'chomage',
    label: 'Taux de chômage',
    category: 'emploi',
    unit: '%',
    frequency: 'monthly',
    color: '#dc2626',
    description: 'Taux de chômage standardisé Eurostat, données mensuelles',
    sourceUrl: 'http://webstat.banque-france.fr/fr/quickviewexport.do?SERIES_KEY=227.STS.M.FR.S.UNEH.RTT000.4.000&type=csv',
    resourceId: '',
    datasetId: '5369a186a3a729239d206615',
  },
  {
    name: 'inflation_ipc',
    label: 'Inflation (IPC)',
    category: 'emploi',
    unit: '%',
    frequency: 'monthly',
    color: '#f59e0b',
    description: "Indice des prix à la consommation, variation annuelle",
    sourceUrl: 'https://api.insee.fr/melodi/file/DS_IPC_PRINC/DS_IPC_PRINC_CSV_FR',
    resourceId: '5961e778-380b-4098-9b7e-33697b44b3c6',
    datasetId: '6983dff81f90da358ccf74d8',
  },
]

export function getIndicatorConfig(name: string): IndicatorConfig | undefined {
  return INDICATOR_CONFIGS.find((c) => c.name === name)
}
```

**Step 2: Create data/events.ts**

```typescript
import { TimelineEvent } from '@/types/events'

export const TIMELINE_EVENTS: TimelineEvent[] = [
  {
    date: '2017-05-14',
    title: 'Élection Emmanuel Macron',
    description: 'Élection du président avec 66,1% des voix au second tour face à Marine Le Pen.',
    category: 'reforme',
    indicatorNames: ['pib', 'chomage'],
    sources: ['https://www.conseil-constitutionnel.fr/'],
    displayOrder: 1,
  },
  {
    date: '2017-12-30',
    title: 'Suppression ISF → IFI',
    description: "Remplacement de l'Impôt de Solidarité sur la Fortune par l'Impôt sur la Fortune Immobilière. Flat tax de 30% sur les revenus du capital.",
    category: 'fiscalite',
    indicatorNames: ['pib'],
    sources: ['https://www.legifrance.gouv.fr/'],
    displayOrder: 2,
  },
  {
    date: '2018-11-17',
    title: 'Mouvement des Gilets jaunes',
    description: "Mouvement social déclenché par la hausse de la taxe carbone sur les carburants. Concessions gouvernementales : prime d'activité, annulation taxe carbone.",
    category: 'social',
    indicatorNames: ['inflation_ipc', 'pib'],
    sources: [],
    displayOrder: 3,
  },
  {
    date: '2020-03-17',
    title: 'Premier confinement COVID-19',
    description: "Confinement national strict. PIB chute de -7,9% sur l'année. Mise en place du \"quoi qu'il en coûte\".",
    category: 'crise',
    indicatorNames: ['pib', 'chomage', 'inflation_ipc'],
    sources: [],
    displayOrder: 4,
  },
  {
    date: '2021-09-03',
    title: 'Plan France Relance',
    description: "Plan de relance de 100 Md€ : transition écologique, compétitivité, cohésion. Prolongé par France 2030 (34 Md€).",
    category: 'reforme',
    indicatorNames: ['pib', 'chomage'],
    sources: ['https://www.economie.gouv.fr/plan-de-relance'],
    displayOrder: 5,
  },
  {
    date: '2023-04-14',
    title: 'Réforme des retraites (49.3)',
    description: "Recul de l'âge légal de départ de 62 à 64 ans. Adoption par 49.3. Mouvement social massif.",
    category: 'reforme',
    indicatorNames: ['chomage'],
    sources: ['https://www.legifrance.gouv.fr/'],
    displayOrder: 6,
  },
]
```

**Step 3: Commit**

```bash
git add data/
git commit -m "feat: add indicator configs and timeline events seed data"
```

---

### Task 6: Create Supabase client and typed queries

**Files:**
- Create: `lib/supabase.ts`
- Create: `lib/queries.ts`

**Step 1: Create lib/supabase.ts**

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

**Step 2: Create lib/queries.ts**

```typescript
import { supabase } from './supabase'
import type { Indicator, Event, EventIndicator, Narrative } from '@/types/database'

export async function getIndicatorSeries(
  name: string,
  country = 'FR',
  startDate?: string,
  endDate?: string
): Promise<Indicator[]> {
  let query = supabase
    .from('indicators')
    .select('*')
    .eq('name', name)
    .eq('country', country)
    .order('date', { ascending: true })

  if (startDate) query = query.gte('date', startDate)
  if (endDate) query = query.lte('date', endDate)

  const { data, error } = await query
  if (error) throw new Error(`Failed to fetch ${name}: ${error.message}`)
  return data as Indicator[]
}

export async function getEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('display_order', { ascending: true })

  if (error) throw new Error(`Failed to fetch events: ${error.message}`)
  return data as Event[]
}

export async function getEventWithIndicators(eventId: string): Promise<{
  event: Event
  indicators: EventIndicator[]
}> {
  const [eventRes, indicatorsRes] = await Promise.all([
    supabase.from('events').select('*').eq('id', eventId).single(),
    supabase.from('event_indicators').select('*').eq('event_id', eventId),
  ])

  if (eventRes.error) throw new Error(eventRes.error.message)
  if (indicatorsRes.error) throw new Error(indicatorsRes.error.message)

  return {
    event: eventRes.data as Event,
    indicators: indicatorsRes.data as EventIndicator[],
  }
}

export async function getNarrative(
  indicatorName: string,
  periodStart: string,
  periodEnd: string
): Promise<Narrative | null> {
  const { data, error } = await supabase
    .from('narratives')
    .select('*')
    .eq('indicator_name', indicatorName)
    .eq('period_start', periodStart)
    .eq('period_end', periodEnd)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data as Narrative | null
}

export async function getAllIndicatorNames(): Promise<string[]> {
  const { data, error } = await supabase
    .from('indicators')
    .select('name')

  if (error) throw new Error(error.message)
  const unique = [...new Set((data as { name: string }[]).map((d) => d.name))]
  return unique
}
```

**Step 3: Commit**

```bash
git add lib/
git commit -m "feat: add Supabase client and typed query helpers"
```

---

### Task 7: Build sync transformers (with tests)

**Files:**
- Create: `lib/sync/transformers.ts`
- Create: `lib/sync/__tests__/transformers.test.ts`

**Step 1: Write the failing tests**

Create `lib/sync/__tests__/transformers.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import {
  parseBanqueDeFranceCsv,
  transformToIndicator,
} from '../transformers'

describe('parseBanqueDeFranceCsv', () => {
  it('parses Banque de France CSV format into date/value pairs', () => {
    // BdF format: semicolon-separated, header rows, then date;value
    const csv = `Title;Taux de chomage
Unit;Pourcentage
Country;France

Date;Value
2017-01;9.6
2017-02;9.5
2017-03;9.4`

    const result = parseBanqueDeFranceCsv(csv)
    expect(result).toEqual([
      { date: '2017-01', value: 9.6 },
      { date: '2017-02', value: 9.5 },
      { date: '2017-03', value: 9.4 },
    ])
  })

  it('skips rows with non-numeric values', () => {
    const csv = `Date;Value
2017-01;9.6
2017-02;N/A
2017-03;9.4`

    const result = parseBanqueDeFranceCsv(csv)
    expect(result).toHaveLength(2)
  })
})

describe('transformToIndicator', () => {
  it('transforms a raw data point to an Indicator insert row', () => {
    const result = transformToIndicator(
      { date: '2017-01', value: 9.6 },
      {
        name: 'chomage',
        category: 'emploi',
        unit: '%',
        frequency: 'monthly',
        country: 'FR',
        datasetId: 'ds-123',
        resourceId: 'rs-456',
      }
    )

    expect(result).toEqual({
      name: 'chomage',
      category: 'emploi',
      date: '2017-01-01',
      value: 9.6,
      unit: '%',
      frequency: 'monthly',
      country: 'FR',
      source_dataset_id: 'ds-123',
      source_resource_id: 'rs-456',
    })
  })

  it('handles quarterly date format (2017-Q1)', () => {
    const result = transformToIndicator(
      { date: '2017-Q1', value: 100 },
      {
        name: 'pib',
        category: 'economie',
        unit: 'Md€',
        frequency: 'quarterly',
        country: 'FR',
        datasetId: '',
        resourceId: '',
      }
    )

    expect(result.date).toBe('2017-01-01')
  })

  it('handles annual date format (2017)', () => {
    const result = transformToIndicator(
      { date: '2017', value: 100 },
      {
        name: 'pib',
        category: 'economie',
        unit: 'Md€',
        frequency: 'annual',
        country: 'FR',
        datasetId: '',
        resourceId: '',
      }
    )

    expect(result.date).toBe('2017-01-01')
  })
})
```

**Step 2: Run tests — verify they fail**

```bash
npx vitest run lib/sync/__tests__/transformers.test.ts
```

Expected: FAIL (module not found)

**Step 3: Write the implementation**

Create `lib/sync/transformers.ts`:

```typescript
export interface RawDataPoint {
  date: string
  value: number
}

export interface TransformContext {
  name: string
  category: 'economie' | 'emploi'
  unit: string
  frequency: 'monthly' | 'quarterly' | 'annual'
  country: string
  datasetId: string
  resourceId: string
}

export interface IndicatorInsert {
  name: string
  category: string
  date: string
  value: number
  unit: string
  frequency: string
  country: string
  source_dataset_id: string
  source_resource_id: string
}

/**
 * Parse Banque de France CSV export format.
 * Format: semicolon-separated, metadata header rows, then Date;Value rows.
 */
export function parseBanqueDeFranceCsv(csv: string): RawDataPoint[] {
  const lines = csv.trim().split('\n')
  const results: RawDataPoint[] = []
  let inData = false

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    if (trimmed.startsWith('Date;') || trimmed.startsWith('Date,')) {
      inData = true
      continue
    }

    if (!inData) continue

    const sep = trimmed.includes(';') ? ';' : ','
    const [date, rawValue] = trimmed.split(sep)
    const value = parseFloat(rawValue)

    if (date && !isNaN(value)) {
      results.push({ date: date.trim(), value })
    }
  }

  return results
}

/**
 * Normalize a date string to ISO format (YYYY-MM-DD).
 * Handles: "2017-01", "2017-Q1", "2017", "2017-01-01"
 */
function normalizeDate(date: string): string {
  // Already full date
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date

  // Quarterly: 2017-Q1 → 2017-01-01
  const quarterMatch = date.match(/^(\d{4})-Q(\d)$/)
  if (quarterMatch) {
    const month = String((parseInt(quarterMatch[2]) - 1) * 3 + 1).padStart(2, '0')
    return `${quarterMatch[1]}-${month}-01`
  }

  // Monthly: 2017-01 → 2017-01-01
  if (/^\d{4}-\d{2}$/.test(date)) return `${date}-01`

  // Annual: 2017 → 2017-01-01
  if (/^\d{4}$/.test(date)) return `${date}-01-01`

  return date
}

/**
 * Transform a raw data point into a Supabase-ready indicator row.
 */
export function transformToIndicator(
  point: RawDataPoint,
  ctx: TransformContext
): IndicatorInsert {
  return {
    name: ctx.name,
    category: ctx.category,
    date: normalizeDate(point.date),
    value: point.value,
    unit: ctx.unit,
    frequency: ctx.frequency,
    country: ctx.country,
    source_dataset_id: ctx.datasetId,
    source_resource_id: ctx.resourceId,
  }
}
```

**Step 4: Run tests — verify they pass**

```bash
npx vitest run lib/sync/__tests__/transformers.test.ts
```

Expected: All tests PASS

**Step 5: Commit**

```bash
git add lib/sync/
git commit -m "feat: add sync transformers with CSV parsing and date normalization"
```

---

### Task 8: Build sync fetchers

**Files:**
- Create: `lib/sync/fetchers.ts`

**Step 1: Create lib/sync/fetchers.ts**

```typescript
import { INDICATOR_CONFIGS } from '@/data/indicator-config'
import type { IndicatorConfig } from '@/types/indicators'
import { parseBanqueDeFranceCsv, type RawDataPoint } from './transformers'

/**
 * Fetch raw data points for a given indicator config.
 * Routes to the appropriate parser based on the source URL.
 */
export async function fetchIndicatorData(
  config: IndicatorConfig
): Promise<RawDataPoint[]> {
  const url = config.sourceUrl

  if (url.includes('webstat.banque-france.fr')) {
    return fetchBanqueDeFrance(url)
  }

  if (url.includes('api.insee.fr/melodi')) {
    return fetchInseeMelodi(url, config.name)
  }

  throw new Error(`Unknown source URL pattern: ${url}`)
}

/**
 * Fetch CSV from Banque de France webstat export.
 */
async function fetchBanqueDeFrance(url: string): Promise<RawDataPoint[]> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`BdF fetch failed: ${response.status} ${response.statusText}`)
  }
  const csv = await response.text()
  return parseBanqueDeFranceCsv(csv)
}

/**
 * Fetch data from INSEE Melodi API.
 * The URL returns a ZIP file containing CSVs.
 * For MVP: we use the MCP to explore and seed data manually.
 * This fetcher is a placeholder for automated sync.
 */
async function fetchInseeMelodi(
  url: string,
  indicatorName: string
): Promise<RawDataPoint[]> {
  // INSEE Melodi returns ZIP files which are complex to parse in serverless.
  // For Phase 1, we seed INSEE data manually via MCP exploration.
  // This will be implemented in Phase 1B when we add ZIP parsing.
  console.warn(
    `[sync] INSEE Melodi fetcher not yet implemented for ${indicatorName}. ` +
    `Use MCP download_and_parse_resource to seed data manually.`
  )
  return []
}

/**
 * Fetch all configured indicators.
 */
export async function fetchAllIndicators(): Promise<
  Map<string, RawDataPoint[]>
> {
  const results = new Map<string, RawDataPoint[]>()

  for (const config of INDICATOR_CONFIGS) {
    try {
      const data = await fetchIndicatorData(config)
      results.set(config.name, data)
    } catch (error) {
      console.error(`[sync] Failed to fetch ${config.name}:`, error)
      results.set(config.name, [])
    }
  }

  return results
}
```

**Step 2: Commit**

```bash
git add lib/sync/fetchers.ts
git commit -m "feat: add sync fetchers for Banque de France and INSEE data sources"
```

---

### Task 9: Build sync pipeline orchestration

**Files:**
- Create: `lib/sync/pipeline.ts`

**Step 1: Create lib/sync/pipeline.ts**

```typescript
import { supabase } from '@/lib/supabase'
import { INDICATOR_CONFIGS } from '@/data/indicator-config'
import { fetchIndicatorData } from './fetchers'
import { transformToIndicator, type TransformContext } from './transformers'

export interface SyncResult {
  indicator: string
  rowsUpserted: number
  status: 'success' | 'error' | 'no_data'
  error?: string
}

/**
 * Run the full sync pipeline for all configured indicators.
 */
export async function runSync(): Promise<SyncResult[]> {
  const results: SyncResult[] = []

  for (const config of INDICATOR_CONFIGS) {
    const result = await syncIndicator(config.name)
    results.push(result)
  }

  return results
}

/**
 * Sync a single indicator: fetch → transform → upsert.
 */
export async function syncIndicator(indicatorName: string): Promise<SyncResult> {
  const config = INDICATOR_CONFIGS.find((c) => c.name === indicatorName)
  if (!config) {
    return { indicator: indicatorName, rowsUpserted: 0, status: 'error', error: 'Config not found' }
  }

  try {
    // 1. Fetch raw data
    const rawData = await fetchIndicatorData(config)
    if (rawData.length === 0) {
      await logSync(config.datasetId, config.resourceId, 0, 'no_change')
      return { indicator: indicatorName, rowsUpserted: 0, status: 'no_data' }
    }

    // 2. Transform
    const ctx: TransformContext = {
      name: config.name,
      category: config.category,
      unit: config.unit,
      frequency: config.frequency,
      country: 'FR',
      datasetId: config.datasetId,
      resourceId: config.resourceId,
    }
    const rows = rawData.map((point) => transformToIndicator(point, ctx))

    // 3. Upsert into Supabase
    const { error } = await supabase
      .from('indicators')
      .upsert(rows, { onConflict: 'name,date,country' })

    if (error) throw error

    // 4. Log
    await logSync(config.datasetId, config.resourceId, rows.length, 'success')

    return { indicator: indicatorName, rowsUpserted: rows.length, status: 'success' }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await logSync(config.datasetId, config.resourceId, 0, 'error', message)
    return { indicator: indicatorName, rowsUpserted: 0, status: 'error', error: message }
  }
}

async function logSync(
  datasetId: string,
  resourceId: string,
  rowsUpdated: number,
  status: string,
  errorMessage?: string
) {
  await supabase.from('sync_log').insert({
    dataset_id: datasetId,
    resource_id: resourceId,
    rows_updated: rowsUpdated,
    status,
    error_message: errorMessage ?? null,
  })
}
```

**Step 2: Commit**

```bash
git add lib/sync/pipeline.ts
git commit -m "feat: add sync pipeline orchestration with upsert and logging"
```

---

### Task 10: Create API routes

**Files:**
- Create: `app/api/sync/route.ts`
- Create: `app/api/indicators/route.ts`

**Step 1: Create app/api/sync/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { runSync } from '@/lib/sync/pipeline'

// Vercel Cron configuration
export const maxDuration = 60

/**
 * POST /api/sync
 * Triggered by Vercel Cron or manually.
 * Protected by CRON_SECRET.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const results = await runSync()
    return NextResponse.json({ results })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

**Step 2: Create app/api/indicators/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getIndicatorSeries, getEvents } from '@/lib/queries'

/**
 * GET /api/indicators?name=pib&country=FR&start=2017-01-01&end=2026-12-31
 * GET /api/indicators?type=events
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')

  try {
    if (type === 'events') {
      const events = await getEvents()
      return NextResponse.json(events)
    }

    const name = searchParams.get('name')
    if (!name) {
      return NextResponse.json(
        { error: 'Missing required parameter: name' },
        { status: 400 }
      )
    }

    const country = searchParams.get('country') || 'FR'
    const start = searchParams.get('start') || undefined
    const end = searchParams.get('end') || undefined

    const data = await getIndicatorSeries(name, country, start, end)
    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

**Step 3: Add Vercel cron config**

Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/sync",
      "schedule": "0 6 * * 1"
    }
  ]
}
```

This runs the sync every Monday at 6:00 UTC.

**Step 4: Commit**

```bash
git add app/api/ vercel.json
git commit -m "feat: add API routes for sync (cron) and indicators (read)"
```

---

### Task 11: Create Zustand store

**Files:**
- Create: `lib/store.ts`

**Step 1: Create lib/store.ts**

```typescript
import { create } from 'zustand'
import type { Indicator, Event } from '@/types/database'

type NavigationState = 'timeline' | 'room'

interface AppState {
  // Navigation
  navigation: NavigationState
  scrollProgress: number
  currentYear: number
  activeEventId: string | null

  // Data
  indicators: Map<string, Indicator[]>
  events: Event[]
  isLoading: boolean

  // Actions
  setScrollProgress: (progress: number) => void
  enterRoom: (eventId: string) => void
  exitRoom: () => void
  setIndicators: (name: string, data: Indicator[]) => void
  setEvents: (events: Event[]) => void
  setLoading: (loading: boolean) => void
}

const START_YEAR = 2017
const END_YEAR = 2026

export const useAppStore = create<AppState>((set) => ({
  navigation: 'timeline',
  scrollProgress: 0,
  currentYear: START_YEAR,
  activeEventId: null,
  indicators: new Map(),
  events: [],
  isLoading: true,

  setScrollProgress: (progress) =>
    set({
      scrollProgress: progress,
      currentYear: Math.floor(START_YEAR + progress * (END_YEAR - START_YEAR)),
    }),

  enterRoom: (eventId) =>
    set({ navigation: 'room', activeEventId: eventId }),

  exitRoom: () =>
    set({ navigation: 'timeline', activeEventId: null }),

  setIndicators: (name, data) =>
    set((state) => {
      const next = new Map(state.indicators)
      next.set(name, data)
      return { indicators: next }
    }),

  setEvents: (events) => set({ events }),

  setLoading: (loading) => set({ isLoading: loading }),
}))
```

**Step 2: Commit**

```bash
git add lib/store.ts
git commit -m "feat: add Zustand store for navigation state and data cache"
```

---

### Task 12: Seed events into Supabase

**Files:**
- Create: `scripts/seed.ts`

**Step 1: Create scripts/seed.ts**

```typescript
/**
 * Seed script — run via: npx tsx scripts/seed.ts
 * Seeds the events table from hardcoded timeline data.
 */
import { createClient } from '@supabase/supabase-js'
import { TIMELINE_EVENTS } from '../data/events'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function seed() {
  console.log('Seeding events...')

  // Insert events
  for (const event of TIMELINE_EVENTS) {
    const { data: inserted, error } = await supabase
      .from('events')
      .upsert(
        {
          date: event.date,
          title: event.title,
          description: event.description,
          category: event.category,
          sources: event.sources,
          display_order: event.displayOrder,
        },
        { onConflict: 'id' }
      )
      .select()
      .single()

    if (error) {
      console.error(`Failed to insert event "${event.title}":`, error.message)
      continue
    }

    console.log(`  ✓ ${event.title}`)

    // Insert event_indicators junction
    for (const indicatorName of event.indicatorNames) {
      await supabase.from('event_indicators').upsert({
        event_id: inserted.id,
        indicator_name: indicatorName,
      }, { onConflict: 'event_id,indicator_name' })
    }
  }

  console.log('Done!')
}

seed().catch(console.error)
```

**Step 2: Install tsx for running TypeScript scripts**

```bash
npm install -D tsx
```

**Step 3: Add seed script to package.json**

Add to scripts: `"seed": "tsx scripts/seed.ts"`

**Step 4: Run the seed**

```bash
npm run seed
```

Expected: 6 events inserted with their indicator associations.

**Step 5: Commit**

```bash
git add scripts/ package.json
git commit -m "feat: add seed script for events and event_indicators"
```

---

### Task 13: Seed indicator data via MCP exploration

This task uses Claude Code's MCP tools to explore the actual data from data.gouv.fr and seed it into Supabase. This is a manual/interactive step.

**Step 1: Explore PIB data via MCP**

Use `mcp__datagouv__download_and_parse_resource` with resource_id `decbe31d-e28c-4f68-9127-d48c7d0a5155` to examine the CSV structure and extract quarterly PIB data from 2015 to 2025.

**Step 2: Explore chômage data via MCP**

Use `mcp__datagouv__download_and_parse_resource` or fetch the Banque de France CSV directly to get monthly unemployment rates for France from 2015 to 2025.

**Step 3: Explore IPC (inflation) data via MCP**

Use `mcp__datagouv__download_and_parse_resource` with resource_id `5961e778-380b-4098-9b7e-33697b44b3c6` to get monthly CPI data.

**Step 4: Insert data into Supabase**

Use `mcp__claude_ai_Supabase__execute_sql` to bulk insert the extracted data into the `indicators` table.

**Step 5: Verify data**

Use `mcp__claude_ai_Supabase__execute_sql`:
```sql
SELECT name, country, COUNT(*), MIN(date), MAX(date) FROM indicators GROUP BY name, country;
```

Expected: 3 rows (pib, chomage, inflation_ipc) with date ranges spanning 2015-2025+.

---

### Task 14: Verify end-to-end

**Step 1: Start dev server**

```bash
npm run dev
```

**Step 2: Test indicators API**

```bash
curl http://localhost:3000/api/indicators?name=pib&start=2017-01-01
curl http://localhost:3000/api/indicators?name=chomage&start=2017-01-01
curl http://localhost:3000/api/indicators?type=events
```

Expected: JSON arrays with real data.

**Step 3: Test sync API**

```bash
curl -X POST http://localhost:3000/api/sync -H "Authorization: Bearer <CRON_SECRET>"
```

Expected: JSON with sync results (chômage should sync from BdF, INSEE indicators will show no_data until fetcher is completed).

**Step 4: Run all tests**

```bash
npm run test:run
```

Expected: All tests pass.

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete Phase 1 — data pipeline with Supabase, sync, and API routes"
```

---

## Phase 2: 3D Timeline Rail (Outline)

> Detailed plan to be written after Phase 1 is complete.

### Task 2.1: Set up R3F Canvas with ErrorBoundary
- Create `components/three/canvas/MainCanvas.tsx` — client component with `<Canvas>`, `<Suspense>`, ErrorBoundary
- Create `components/three/canvas/LoadingScreen.tsx` — loading UI with progress
- Create `app/experience/page.tsx` — page that renders MainCanvas

### Task 2.2: Create scroll-driven camera rail
- Create `components/three/world/Timeline.tsx` — `<ScrollControls>` wrapper
- Define camera path as a CatmullRom curve from position (0,2,0) to (100,2,0)
- Map scroll progress to camera position on the curve

### Task 2.3: Create procedural terrain
- Create `components/three/world/Terrain.tsx` — low-poly terrain geometry
- Generate terrain from simplex noise, seeded by year
- Terrain color palette changes per era (warm→cold→warm)

### Task 2.4: Create year markers and event markers
- Create `components/three/world/YearMarker.tsx` — 3D text + line at each year
- Create event markers as glowing objects at event positions on the path
- Click handler on event markers → `useAppStore.enterRoom()`

### Task 2.5: Create atmosphere system
- Create `components/three/world/Atmosphere.tsx` — Sky, fog, lighting
- Parameters driven by scroll progress / current year
- Smooth transitions between eras

### Task 2.6: Data loading on mount
- Fetch all indicator data and events on mount via API routes
- Store in Zustand
- Display year + key numbers as `<Html>` overlay while scrolling

---

## Phase 3: Event Rooms (Outline)

> Detailed plan to be written after Phase 2 is complete.

### Task 3.1: Room loader and lifecycle
- Create `components/three/rooms/RoomLoader.tsx` — lazy mount/unmount
- Camera transition animation (from path position into room)
- Back button returns to timeline

### Task 3.2: Room layout and navigation
- Create `components/three/rooms/EventRoom.tsx` — enclosed 3D space
- `<KeyboardControls>` for WASD navigation inside room
- Collision boundaries via Rapier

### Task 3.3: Data visualization objects
- Create `components/three/data-viz/DataColumn.tsx` — 3D bar chart column
- Create `components/three/data-viz/DataSphere.tsx` — sized sphere
- Position objects in room, values from Zustand store

### Task 3.4: HTML data panels
- Create `components/three/data-viz/DataPanel.tsx` — `<Html>` with Recharts
- Create `components/ui/Chart.tsx` — Recharts line/bar chart component
- Create `components/ui/Narrative.tsx` — narrative text block
- Panels anchored to 3D positions, appear on approach

### Task 3.5: Implement 3 event rooms
- COVID-19 room (2020): PIB crash + chômage spike + rebond
- Gilets jaunes room (2018): inflation, pouvoir d'achat
- Retraites room (2023): emploi, social tensions

---

## Phase 4: Polish (Outline)

> Detailed plan to be written after Phase 3 is complete.

### Task 4.1: Mobile controls
- Touch joystick for room navigation
- Scroll works natively for timeline
- Responsive layout for data panels

### Task 4.2: Landing page and SEO fallback
- SSR landing with static charts (Recharts)
- Meta tags, OG images
- Link to `/experience` for 3D

### Task 4.3: Performance optimization
- LOD for terrain
- On-demand frame rendering when idle
- Asset compression (Draco for GLB)
- `<PerformanceMonitor>` adaptive quality

### Task 4.4: Accessibility fallback
- `<AccessibleFallback>` component
- ErrorBoundary catches WebGL failure → renders fallback
- Keyboard navigation for non-3D elements

### Task 4.5: Deploy to Vercel
- Configure Vercel project
- Set environment variables
- Enable cron job
- Test preview deployment
