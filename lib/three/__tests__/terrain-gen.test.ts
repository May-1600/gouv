// lib/three/__tests__/terrain-gen.test.ts
import { describe, it, expect } from 'vitest'
import { generateTerrainVertices, TERRAIN_WIDTH, TERRAIN_SEGMENTS } from '../terrain-gen'

describe('generateTerrainVertices', () => {
  it('returns a Float32Array of positions', () => {
    const result = generateTerrainVertices(0.5)
    expect(result.positions).toBeInstanceOf(Float32Array)
  })

  it('returns correct number of vertices', () => {
    const result = generateTerrainVertices(0.5)
    const expectedCount = (TERRAIN_SEGMENTS + 1) * (TERRAIN_SEGMENTS + 1) * 3
    expect(result.positions.length).toBe(expectedCount)
  })

  it('applies noise displacement to y values', () => {
    const result = generateTerrainVertices(1.0)
    const yValues: number[] = []
    for (let i = 1; i < result.positions.length; i += 3) {
      yValues.push(result.positions[i])
    }
    const hasDisplacement = yValues.some((y) => Math.abs(y) > 0.01)
    expect(hasDisplacement).toBe(true)
  })

  it('produces flat terrain when amplitude is 0', () => {
    const result = generateTerrainVertices(0)
    for (let i = 1; i < result.positions.length; i += 3) {
      expect(Math.abs(result.positions[i])).toBeLessThan(0.001)
    }
  })

  it('returns a colors array of same vertex count', () => {
    const result = generateTerrainVertices(0.5, '#a5d6a7')
    expect(result.colors).toBeInstanceOf(Float32Array)
    expect(result.colors.length).toBe(result.positions.length)
  })
})

describe('TERRAIN_WIDTH', () => {
  it('is at least 20 units wide', () => {
    expect(TERRAIN_WIDTH).toBeGreaterThanOrEqual(20)
  })
})
