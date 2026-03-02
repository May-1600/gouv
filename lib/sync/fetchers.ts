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
 * For MVP: we seed INSEE data manually via MCP exploration.
 * This fetcher is a placeholder for automated sync.
 */
async function fetchInseeMelodi(
  url: string,
  indicatorName: string
): Promise<RawDataPoint[]> {
  // INSEE Melodi returns ZIP files which are complex to parse in serverless.
  // For Phase 1, we seed INSEE data manually via MCP exploration.
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
