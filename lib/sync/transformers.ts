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
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date

  const quarterMatch = date.match(/^(\d{4})-Q(\d)$/)
  if (quarterMatch) {
    const month = String((parseInt(quarterMatch[2]) - 1) * 3 + 1).padStart(2, '0')
    return `${quarterMatch[1]}-${month}-01`
  }

  if (/^\d{4}-\d{2}$/.test(date)) return `${date}-01`
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
