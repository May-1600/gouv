'use client'

import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import type { DataPoint } from '@/types/room'
import { useReducedMotion } from '@/lib/hooks/useReducedMotion'

interface DataColumnProps {
  point: DataPoint
  maxValue: number
  color: string
  position: [number, number, number]
  maxHeight?: number
  delay?: number
}

export function DataColumn({
  point,
  maxValue,
  color,
  position,
  maxHeight = 4,
  delay = 0,
}: DataColumnProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [animatedHeight, setAnimatedHeight] = useState(0.01)
  const elapsedRef = useRef(0)
  const reducedMotion = useReducedMotion()

  const targetHeight = Math.max(
    0.1,
    maxValue > 0 ? (point.value / maxValue) * maxHeight : 0.1
  )

  useFrame((_, delta) => {
    if (reducedMotion) {
      if (animatedHeight !== targetHeight) setAnimatedHeight(targetHeight)
      return
    }

    elapsedRef.current += delta

    if (elapsedRef.current < delay) return

    const newHeight = THREE.MathUtils.lerp(animatedHeight, targetHeight, Math.min(1, delta * 4))
    if (Math.abs(newHeight - animatedHeight) > 0.001) {
      setAnimatedHeight(newHeight)
    }
  })

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        position={[0, animatedHeight / 2, 0]}
        castShadow
      >
        <boxGeometry args={[0.4, animatedHeight, 0.4]} />
        <meshStandardMaterial
          color={color}
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>

      <Text
        position={[0, animatedHeight + 0.3, 0]}
        fontSize={0.2}
        color="#1a1a2e"
        anchorX="center"
        anchorY="bottom"
      >
        {point.value.toFixed(1)}
      </Text>

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
          color={
            point.date === eventDate || point.date.startsWith(eventDate.slice(0, 7))
              ? '#ef4444'
              : color
          }
          position={[(i - slice.length / 2) * 0.7, 0, 0]}
          delay={i * 0.08}
        />
      ))}
    </group>
  )
}
