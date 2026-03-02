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
