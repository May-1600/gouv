import { describe, it, expect } from 'vitest'
import {
  parseBanqueDeFranceCsv,
  transformToIndicator,
} from '../transformers'

describe('parseBanqueDeFranceCsv', () => {
  it('parses Banque de France CSV format into date/value pairs', () => {
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
