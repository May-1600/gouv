'use client'

import { useRef } from 'react'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import type { DataPoint } from '@/types/room'

interface DataColumnProps {
  point: DataPoint
  maxValue: number
  color: string
  position: [number, number, number]
  maxHeight?: number
}

export function DataColumn({
  point,
  maxValue,
  color,
  position,
  maxHeight = 4,
}: DataColumnProps) {
  const meshRef = useRef<THREE.Mesh>(null)

  const normalizedHeight = maxValue > 0
    ? (point.value / maxValue) * maxHeight
    : 0.1

  const height = Math.max(0.1, normalizedHeight)

  return (
    <group position={position}>
      {/* Column */}
      <mesh
        ref={meshRef}
        position={[0, height / 2, 0]}
        castShadow
      >
        <boxGeometry args={[0.4, height, 0.4]} />
        <meshStandardMaterial
          color={color}
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>

      {/* Value label on top */}
      <Text
        position={[0, height + 0.3, 0]}
        fontSize={0.2}
        color="#1a1a2e"
        anchorX="center"
        anchorY="bottom"
      >
        {point.value.toFixed(1)}
      </Text>

      {/* Date label at bottom */}
      <Text
        position={[0, -0.2, 0]}
        fontSize={0.15}
        color="#94a3b8"
        anchorX="center"
        anchorY="top"
        rotation={[-Math.PI / 4, 0, 0]}
      >
        {point.date.slice(0, 7)}
      </Text>
    </group>
  )
}

/**
 * A row of DataColumns for a single indicator.
 * Shows data points around the event date (+-4 points).
 */
interface DataColumnRowProps {
  data: DataPoint[]
  eventDate: string
  color: string
  position: [number, number, number]
}

export function DataColumnRow({ data, eventDate, color, position }: DataColumnRowProps) {
  const eventIndex = data.findIndex((d) => d.date >= eventDate)
  const centerIndex = eventIndex >= 0 ? eventIndex : Math.floor(data.length / 2)

  const start = Math.max(0, centerIndex - 4)
  const end = Math.min(data.length, centerIndex + 5)
  const slice = data.slice(start, end)

  const maxValue = Math.max(...slice.map((d) => Math.abs(d.value)), 1)

  return (
    <group position={position}>
      {slice.map((point, i) => (
        <DataColumn
          key={point.date}
          point={point}
          maxValue={maxValue}
          color={point.date === eventDate || point.date.startsWith(eventDate.slice(0, 7))
            ? '#ef4444'
            : color}
          position={[(i - slice.length / 2) * 0.7, 0, 0]}
        />
      ))}
    </group>
  )
}
