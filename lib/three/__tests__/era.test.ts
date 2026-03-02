// lib/three/__tests__/era.test.ts
import { describe, it, expect } from 'vitest'
import { getEraConfig, yearToScrollOffset, scrollOffsetToYear } from '../era'

describe('yearToScrollOffset', () => {
  it('maps 2017 to 0', () => {
    expect(yearToScrollOffset(2017)).toBe(0)
  })

  it('maps 2026 to 1', () => {
    expect(yearToScrollOffset(2026)).toBe(1)
  })

  it('maps 2020 to ~0.333', () => {
    expect(yearToScrollOffset(2020)).toBeCloseTo(3 / 9, 3)
  })

  it('clamps below 2017 to 0', () => {
    expect(yearToScrollOffset(2010)).toBe(0)
  })

  it('clamps above 2026 to 1', () => {
    expect(yearToScrollOffset(2030)).toBe(1)
  })
})

describe('scrollOffsetToYear', () => {
  it('maps 0 to 2017', () => {
    expect(scrollOffsetToYear(0)).toBe(2017)
  })

  it('maps 1 to 2026', () => {
    expect(scrollOffsetToYear(1)).toBe(2026)
  })

  it('maps 0.5 to 2021 (floor)', () => {
    expect(scrollOffsetToYear(0.5)).toBe(2021)
  })
})

describe('getEraConfig', () => {
  it('returns optimism era for 2017', () => {
    const era = getEraConfig(2017)
    expect(era.name).toBe('optimism')
    expect(era.fogColor).toBeDefined()
    expect(era.groundColor).toBeDefined()
    expect(era.skyColor).toBeDefined()
    expect(era.lightIntensity).toBeGreaterThan(0)
    expect(era.fogDensity).toBeGreaterThan(0)
  })

  it('returns crisis era for 2020', () => {
    const era = getEraConfig(2020)
    expect(era.name).toBe('crisis')
  })

  it('returns recovery era for 2021', () => {
    const era = getEraConfig(2021)
    expect(era.name).toBe('recovery')
  })

  it('returns tension era for 2023', () => {
    const era = getEraConfig(2023)
    expect(era.name).toBe('tension')
  })

  it('returns present era for 2025', () => {
    const era = getEraConfig(2025)
    expect(era.name).toBe('present')
  })

  it('interpolates between eras for fractional years', () => {
    const a = getEraConfig(2019)
    const b = getEraConfig(2020)
    expect(a.name).not.toBe(b.name)
  })
})
