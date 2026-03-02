import { describe, it, expect } from 'vitest'
import {
  getCameraPosition,
  getLookAtTarget,
  getPathPoints,
  PATH_LENGTH,
  CAMERA_HEIGHT,
} from '../camera-path'

describe('PATH_LENGTH', () => {
  it('is 100 units', () => {
    expect(PATH_LENGTH).toBe(100)
  })
})

describe('CAMERA_HEIGHT', () => {
  it('is 3 units', () => {
    expect(CAMERA_HEIGHT).toBe(3)
  })
})

describe('getPathPoints', () => {
  it('returns an array of Vector3-like objects', () => {
    const points = getPathPoints()
    expect(points.length).toBeGreaterThan(2)
    expect(points[0]).toHaveProperty('x')
    expect(points[0]).toHaveProperty('y')
    expect(points[0]).toHaveProperty('z')
  })

  it('starts near x=0 and ends near x=PATH_LENGTH', () => {
    const points = getPathPoints()
    expect(points[0].x).toBeCloseTo(0, 0)
    expect(points[points.length - 1].x).toBeCloseTo(PATH_LENGTH, 0)
  })
})

describe('getCameraPosition', () => {
  it('returns position at start when offset=0', () => {
    const pos = getCameraPosition(0)
    expect(pos.x).toBeCloseTo(0, 0)
    expect(pos.y).toBeCloseTo(CAMERA_HEIGHT, 0)
  })

  it('returns position at end when offset=1', () => {
    const pos = getCameraPosition(1)
    expect(pos.x).toBeCloseTo(PATH_LENGTH, 0)
    expect(pos.y).toBeCloseTo(CAMERA_HEIGHT, 0)
  })

  it('returns intermediate position at offset=0.5', () => {
    const pos = getCameraPosition(0.5)
    expect(pos.x).toBeGreaterThan(0)
    expect(pos.x).toBeLessThan(PATH_LENGTH)
  })

  it('clamps offset below 0', () => {
    const pos = getCameraPosition(-0.5)
    expect(pos.x).toBeCloseTo(0, 0)
  })

  it('clamps offset above 1', () => {
    const pos = getCameraPosition(1.5)
    expect(pos.x).toBeCloseTo(PATH_LENGTH, 0)
  })
})

describe('getLookAtTarget', () => {
  it('is always ahead of camera position', () => {
    const pos = getCameraPosition(0.3)
    const target = getLookAtTarget(0.3)
    expect(target.x).toBeGreaterThan(pos.x)
  })

  it('at end, looks slightly forward', () => {
    const target = getLookAtTarget(1)
    expect(target.x).toBeGreaterThanOrEqual(PATH_LENGTH)
  })
})
