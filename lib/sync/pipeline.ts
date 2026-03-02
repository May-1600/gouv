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
    return {
      indicator: indicatorName,
      rowsUpserted: 0,
      status: 'error',
      error: 'Config not found',
    }
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

    return {
      indicator: indicatorName,
      rowsUpserted: rows.length,
      status: 'success',
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await logSync(config.datasetId, config.resourceId, 0, 'error', message)
    return {
      indicator: indicatorName,
      rowsUpserted: 0,
      status: 'error',
      error: message,
    }
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
