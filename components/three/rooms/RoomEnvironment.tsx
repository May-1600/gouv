'use client'

import type { RoomStyle } from '@/lib/three/room-config'

const ROOM_WIDTH = 16
const ROOM_DEPTH = 12
const ROOM_HEIGHT = 6

interface RoomEnvironmentProps {
  style: RoomStyle
}

export function RoomEnvironment({ style }: RoomEnvironmentProps) {
  return (
    <group>
      {/* Lighting */}
      <ambientLight intensity={style.ambientIntensity} />
      <directionalLight position={[5, 8, 3]} intensity={0.8} castShadow />
      <pointLight position={[-3, 4, 0]} intensity={0.3} color={style.accentColor} />

      {/* Floor */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
        <meshStandardMaterial
          color={style.floorColor}
          roughness={0.8}
          metalness={0}
        />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, ROOM_HEIGHT / 2, -ROOM_DEPTH / 2]}>
        <planeGeometry args={[ROOM_WIDTH, ROOM_HEIGHT]} />
        <meshStandardMaterial
          color={style.wallColor}
          roughness={0.9}
          metalness={0}
        />
      </mesh>

      {/* Left wall */}
      <mesh
        position={[-ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <planeGeometry args={[ROOM_DEPTH, ROOM_HEIGHT]} />
        <meshStandardMaterial
          color={style.wallColor}
          roughness={0.9}
          metalness={0}
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* Right wall */}
      <mesh
        position={[ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0]}
        rotation={[0, -Math.PI / 2, 0]}
      >
        <planeGeometry args={[ROOM_DEPTH, ROOM_HEIGHT]} />
        <meshStandardMaterial
          color={style.wallColor}
          roughness={0.9}
          metalness={0}
          transparent
          opacity={0.4}
        />
      </mesh>
    </group>
  )
}

export { ROOM_WIDTH, ROOM_DEPTH, ROOM_HEIGHT }
