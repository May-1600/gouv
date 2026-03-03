'use client'

import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { yearToPathX } from '@/lib/three/camera-path'
import { useAppStore } from '@/lib/store'

const CATEGORY_COLORS: Record<string, string> = {
  fiscalite: '#f59e0b',
  emploi: '#3b82f6',
  crise: '#ef4444',
  reforme: '#8b5cf6',
  social: '#f97316',
  international: '#06b6d4',
}

function EventMarker({
  eventId,
  date,
  title,
  category,
}: {
  eventId: string
  date: string
  title: string
  category: string
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const enterRoom = useAppStore((s) => s.enterRoom)

  const year = new Date(date).getFullYear()
  const monthFraction = new Date(date).getMonth() / 12
  const x = yearToPathX(year + monthFraction)
  const color = CATEGORY_COLORS[category] || '#a78bfa'

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    meshRef.current.position.y = 1.5 + Math.sin(clock.elapsedTime * 2) * 0.1
    meshRef.current.scale.setScalar(hovered ? 1.3 : 1)
  })

  return (
    <group position={[x, 0, 0]}>
      <mesh
        ref={meshRef}
        position={[0, 1.5, 0]}
        onClick={() => enterRoom(eventId)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <dodecahedronGeometry args={[0.4, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 0.8 : 0.3}
          roughness={0.6}
        />
      </mesh>

      <Text
        position={[0, 0.6, 0]}
        fontSize={0.25}
        color="#1a1a2e"
        anchorX="center"
        anchorY="top"
        maxWidth={3}
      >
        {title}
      </Text>
    </group>
  )
}

export function EventMarkers() {
  const events = useAppStore((s) => s.events)

  return (
    <group>
      {events.map((event) => (
        <EventMarker
          key={event.id}
          eventId={event.id}
          date={event.date}
          title={event.title}
          category={event.category ?? 'reforme'}
        />
      ))}
    </group>
  )
}
