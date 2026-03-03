'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { generateTerrainVertices, TERRAIN_WIDTH, TERRAIN_SEGMENTS } from '@/lib/three/terrain-gen'
import { getEraConfig, scrollOffsetToYear } from '@/lib/three/era'
import { PATH_LENGTH } from '@/lib/three/camera-path'

const CHUNK_SIZE = 25
const CHUNK_COUNT = Math.ceil(PATH_LENGTH / CHUNK_SIZE)

function TerrainChunk({ chunkIndex }: { chunkIndex: number }) {
  const offsetX = chunkIndex * CHUNK_SIZE
  const centerX = offsetX + CHUNK_SIZE / 2
  const progress = centerX / PATH_LENGTH
  const year = scrollOffsetToYear(progress)
  const era = getEraConfig(year)

  const geometry = useMemo(() => {
    const { positions, colors } = generateTerrainVertices(
      era.terrainAmplitude,
      era.groundColor,
      offsetX
    )

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const indices: number[] = []
    const verticesPerSide = TERRAIN_SEGMENTS + 1
    for (let iz = 0; iz < TERRAIN_SEGMENTS; iz++) {
      for (let ix = 0; ix < TERRAIN_SEGMENTS; ix++) {
        const a = iz * verticesPerSide + ix
        const b = a + 1
        const c = a + verticesPerSide
        const d = c + 1
        indices.push(a, c, b)
        indices.push(b, c, d)
      }
    }
    geo.setIndex(indices)
    geo.computeVertexNormals()

    return geo
  }, [era.terrainAmplitude, era.groundColor, offsetX])

  return (
    <mesh
      geometry={geometry}
      position={[offsetX + CHUNK_SIZE / 2, 0, 0]}
      receiveShadow
    >
      <meshStandardMaterial
        vertexColors
        flatShading
        roughness={0.9}
        metalness={0.0}
      />
    </mesh>
  )
}

export function Terrain() {
  return (
    <group>
      {Array.from({ length: CHUNK_COUNT }, (_, i) => (
        <TerrainChunk key={i} chunkIndex={i} />
      ))}
    </group>
  )
}
