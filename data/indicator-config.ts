import { IndicatorConfig } from '@/types/indicators'

export const INDICATOR_CONFIGS: IndicatorConfig[] = [
  {
    name: 'pib',
    label: 'PIB (Produit Int\u00e9rieur Brut)',
    category: 'economie',
    unit: 'Md\u20ac',
    frequency: 'quarterly',
    color: '#2563eb',
    description: 'Produit int\u00e9rieur brut en volume, donn\u00e9es trimestrielles',
    sourceUrl: 'https://api.insee.fr/melodi/file/DD_CNA_AGREGATS/DD_CNA_AGREGATS_CSV_FR',
    resourceId: 'decbe31d-e28c-4f68-9127-d48c7d0a5155',
    datasetId: '66685856500cccd9a7089112',
  },
  {
    name: 'chomage',
    label: 'Taux de ch\u00f4mage',
    category: 'emploi',
    unit: '%',
    frequency: 'monthly',
    color: '#dc2626',
    description: 'Taux de ch\u00f4mage standardis\u00e9 Eurostat, donn\u00e9es mensuelles',
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
    description: "Indice des prix \u00e0 la consommation, variation annuelle",
    sourceUrl: 'https://api.insee.fr/melodi/file/DS_IPC_PRINC/DS_IPC_PRINC_CSV_FR',
    resourceId: '5961e778-380b-4098-9b7e-33697b44b3c6',
    datasetId: '6983dff81f90da358ccf74d8',
  },
]

export function getIndicatorConfig(name: string): IndicatorConfig | undefined {
  return INDICATOR_CONFIGS.find((c) => c.name === name)
}
