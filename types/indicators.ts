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
