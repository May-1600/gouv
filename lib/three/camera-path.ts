import * as THREE from 'three'

export const PATH_LENGTH = 100
export const CAMERA_HEIGHT = 3 // ground path reference height
const LOOK_AHEAD = 0.03

/**
 * 3/4 view offset: camera sits above and to the south-west of the path,
 * giving an isometric-like perspective with the path advancing northeast.
 */
export const CAMERA_OFFSET = new THREE.Vector3(-6, 10, 8)

/** Ground-level path control points (gentle S-curve along x-axis) */
const GROUND_POINTS = [
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(20, 0, 1.5),
  new THREE.Vector3(40, 0.3, -1),
  new THREE.Vector3(55, 0, 1),
  new THREE.Vector3(70, -0.2, -0.5),
  new THREE.Vector3(85, 0.1, 0.8),
  new THREE.Vector3(100, 0, 0),
]

const groundCurve = new THREE.CatmullRomCurve3(GROUND_POINTS, false, 'catmullrom', 0.5)

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}

/** Get sampled points along the ground path (for debugging). */
export function getPathPoints(): THREE.Vector3[] {
  return groundCurve.getPoints(50)
}

/** Get the ground-level position at a scroll offset. Used for markers. */
export function getGroundPosition(offset: number): THREE.Vector3 {
  return groundCurve.getPointAt(clamp01(offset))
}

/** Get camera world position: ground path + 3/4 view offset. */
export function getCameraPosition(offset: number): THREE.Vector3 {
  const ground = groundCurve.getPointAt(clamp01(offset))
  return ground.clone().add(CAMERA_OFFSET)
}

/** Get the lookAt target: slightly ahead on the ground path. */
export function getLookAtTarget(offset: number): THREE.Vector3 {
  const aheadOffset = clamp01(offset + LOOK_AHEAD)
  if (offset >= 1 - LOOK_AHEAD) {
    const ground = groundCurve.getPointAt(1)
    return new THREE.Vector3(ground.x + 5, 0, ground.z)
  }
  return groundCurve.getPointAt(aheadOffset)
}

/** Convert a year (2017-2026) to a 3D position on the ground path. */
export function yearToPathPosition(year: number): THREE.Vector3 {
  const t = clamp01((year - 2017) / 9)
  return groundCurve.getPointAt(t)
}

/** @deprecated Use yearToPathPosition instead */
export function yearToPathX(year: number): number {
  return ((year - 2017) / 9) * PATH_LENGTH
}
