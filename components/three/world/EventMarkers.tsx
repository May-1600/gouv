'use client'

import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { yearToPathPosition } from '@/lib/three/camera-path'
import { useAppStore } from '@/lib/store'
import { useReducedMotion } from '@/lib/hooks/useReducedMotion'

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
  const ringRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const enterRoom = useAppStore((s) => s.enterRoom)
  const reducedMotion = useReducedMotion()

  const year = new Date(date).getFullYear()
  const monthFraction = new Date(date).getMonth() / 12
  const pathPos = yearToPathPosition(year + monthFraction)
  const color = CATEGORY_COLORS[category] || '#a78bfa'

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const t = clock.elapsedTime

    if (!reducedMotion) {
      meshRef.current.position.y = 1.5 + Math.sin(t * 2) * 0.1
      meshRef.current.rotation.y = t * 0.5
    }

    const targetScale = hovered ? 1.3 : 1
    const currentScale = meshRef.current.scale.x
    meshRef.current.scale.setScalar(
      THREE.MathUtils.lerp(currentScale, targetScale, 0.1)
    )

    if (ringRef.current && !reducedMotion) {
      const pulse = 1 + Math.sin(t * 3) * 0.2
      ringRef.current.scale.setScalar(pulse)
      ;(ringRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.15 + Math.sin(t * 3) * 0.1
    }
  })

  return (
    <group position={[pathPos.x, 0, pathPos.z]}>
      {/* Pulse ring on ground */}
      <mesh
        ref={ringRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.05, 0]}
      >
        <ringGeometry args={[0.6, 0.8, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Marker dodecahedron */}
      <mesh
        ref={meshRef}
        position={[0, 1.5, 0]}
        onClick={() => enterRoom(eventId)}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = 'auto'
        }}
      >
        <dodecahedronGeometry args={[0.4, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 0.8 : 0.3}
          roughness={0.6}
        />
      </mesh>

      {/* Title label */}
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

      {/* Category badge — visible on hover */}
      {hovered && (
        <Text
          position={[0, 2.5, 0]}
          fontSize={0.18}
          color={color}
          anchorX="center"
          anchorY="bottom"
        >
          {category.toUpperCase()}
        </Text>
      )}
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
