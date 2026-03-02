import * as THREE from 'three'

export const PATH_LENGTH = 100
export const CAMERA_HEIGHT = 3
const LOOK_AHEAD = 0.02

const CONTROL_POINTS = [
  new THREE.Vector3(0, CAMERA_HEIGHT, 0),
  new THREE.Vector3(20, CAMERA_HEIGHT, 1.5),
  new THREE.Vector3(40, CAMERA_HEIGHT + 0.5, -1),
  new THREE.Vector3(55, CAMERA_HEIGHT, 1),
  new THREE.Vector3(70, CAMERA_HEIGHT - 0.3, -0.5),
  new THREE.Vector3(85, CAMERA_HEIGHT + 0.2, 0.8),
  new THREE.Vector3(100, CAMERA_HEIGHT, 0),
]

const curve = new THREE.CatmullRomCurve3(CONTROL_POINTS, false, 'catmullrom', 0.5)

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}

export function getPathPoints(): THREE.Vector3[] {
  return curve.getPoints(50)
}

export function getCameraPosition(offset: number): THREE.Vector3 {
  return curve.getPointAt(clamp01(offset))
}

export function getLookAtTarget(offset: number): THREE.Vector3 {
  const aheadOffset = clamp01(offset + LOOK_AHEAD)
  if (offset >= 1 - LOOK_AHEAD) {
    const pos = curve.getPointAt(1)
    return new THREE.Vector3(pos.x + 5, pos.y - 0.5, pos.z)
  }
  const target = curve.getPointAt(aheadOffset)
  target.y -= 0.5
  return target
}

export function yearToPathX(year: number): number {
  return ((year - 2017) / 9) * PATH_LENGTH
}
