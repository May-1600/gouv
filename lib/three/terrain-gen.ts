// lib/three/terrain-gen.ts
import { createNoise2D } from 'simplex-noise'
import * as THREE from 'three'

export const TERRAIN_WIDTH = 30
export const TERRAIN_SEGMENTS = 64

const noise2D = createNoise2D()

export function generateTerrainVertices(
  amplitude: number,
  baseColorHex: string = '#a5d6a7',
  offsetX: number = 0
): { positions: Float32Array; colors: Float32Array } {
  const verticesPerSide = TERRAIN_SEGMENTS + 1
  const count = verticesPerSide * verticesPerSide
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)

  const baseColor = new THREE.Color(baseColorHex)
  const darkVariant = baseColor.clone().multiplyScalar(0.7)
  const lightVariant = baseColor.clone().lerp(new THREE.Color('#ffffff'), 0.3)

  const halfWidth = TERRAIN_WIDTH / 2
  const stepX = TERRAIN_WIDTH / TERRAIN_SEGMENTS
  const stepZ = TERRAIN_WIDTH / TERRAIN_SEGMENTS

  let idx = 0
  for (let iz = 0; iz < verticesPerSide; iz++) {
    for (let ix = 0; ix < verticesPerSide; ix++) {
      const x = ix * stepX - halfWidth + offsetX
      const z = iz * stepZ - halfWidth

      const n1 = noise2D(x * 0.05, z * 0.05) * 1.0
      const n2 = noise2D(x * 0.1, z * 0.1) * 0.5
      const n3 = noise2D(x * 0.2, z * 0.2) * 0.25
      const height = (n1 + n2 + n3) * amplitude

      const distFromCenter = Math.abs(z)
      const pathFalloff = distFromCenter < 2 ? 0 : Math.min(1, (distFromCenter - 2) / 3)

      positions[idx * 3] = x
      positions[idx * 3 + 1] = height * pathFalloff
      positions[idx * 3 + 2] = z

      const t = (height * pathFalloff + amplitude) / (2 * Math.max(amplitude, 0.001))
      const vertexColor = darkVariant.clone().lerp(lightVariant, Math.max(0, Math.min(1, t)))
      colors[idx * 3] = vertexColor.r
      colors[idx * 3 + 1] = vertexColor.g
      colors[idx * 3 + 2] = vertexColor.b

      idx++
    }
  }

  return { positions, colors }
}
