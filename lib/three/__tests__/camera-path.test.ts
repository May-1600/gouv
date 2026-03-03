import { describe, it, expect } from 'vitest'
import {
  getCameraPosition,
  getLookAtTarget,
  getPathPoints,
  getGroundPosition,
  yearToPathPosition,
  PATH_LENGTH,
  CAMERA_HEIGHT,
  CAMERA_OFFSET,
} from '../camera-path'

describe('PATH_LENGTH', () => {
  it('is 100 units', () => {
    expect(PATH_LENGTH).toBe(100)
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

describe('getGroundPosition', () => {
  it('returns ground-level position at offset=0', () => {
    const pos = getGroundPosition(0)
    expect(pos.x).toBeCloseTo(0, 0)
    expect(pos.y).toBeCloseTo(0, 0)
  })

  it('returns ground-level position at offset=1', () => {
    const pos = getGroundPosition(1)
    expect(pos.x).toBeCloseTo(PATH_LENGTH, 0)
  })
})

describe('getCameraPosition', () => {
  it('is offset from ground path by CAMERA_OFFSET', () => {
    const ground = getGroundPosition(0)
    const cam = getCameraPosition(0)
    expect(cam.x).toBeCloseTo(ground.x + CAMERA_OFFSET.x, 0)
    expect(cam.y).toBeCloseTo(ground.y + CAMERA_OFFSET.y, 0)
    expect(cam.z).toBeCloseTo(ground.z + CAMERA_OFFSET.z, 0)
  })

  it('is elevated above the ground path', () => {
    const cam = getCameraPosition(0.5)
    const ground = getGroundPosition(0.5)
    expect(cam.y).toBeGreaterThan(ground.y + 5)
  })

  it('advances along x as offset increases', () => {
    const start = getCameraPosition(0)
    const mid = getCameraPosition(0.5)
    const end = getCameraPosition(1)
    expect(mid.x).toBeGreaterThan(start.x)
    expect(end.x).toBeGreaterThan(mid.x)
  })

  it('clamps offset below 0', () => {
    const pos = getCameraPosition(-0.5)
    const start = getCameraPosition(0)
    expect(pos.x).toBeCloseTo(start.x, 1)
  })

  it('clamps offset above 1', () => {
    const pos = getCameraPosition(1.5)
    const end = getCameraPosition(1)
    expect(pos.x).toBeCloseTo(end.x, 1)
  })
})

describe('getLookAtTarget', () => {
  it('is ahead of the ground position on x', () => {
    const ground = getGroundPosition(0.3)
    const target = getLookAtTarget(0.3)
    expect(target.x).toBeGreaterThan(ground.x)
  })

  it('at end, looks slightly forward past PATH_LENGTH', () => {
    const target = getLookAtTarget(1)
    expect(target.x).toBeGreaterThanOrEqual(PATH_LENGTH)
  })

  it('is at ground level (not elevated)', () => {
    const target = getLookAtTarget(0.5)
    expect(Math.abs(target.y)).toBeLessThan(2)
  })
})

describe('yearToPathPosition', () => {
  it('returns position near x=0 for 2017', () => {
    const pos = yearToPathPosition(2017)
    expect(pos.x).toBeCloseTo(0, 0)
  })

  it('returns position near x=PATH_LENGTH for 2026', () => {
    const pos = yearToPathPosition(2026)
    expect(pos.x).toBeCloseTo(PATH_LENGTH, 0)
  })

  it('returns intermediate position for 2021', () => {
    const pos = yearToPathPosition(2021)
    expect(pos.x).toBeGreaterThan(10)
    expect(pos.x).toBeLessThan(80)
  })
})
