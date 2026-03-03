'use client'

import { useAppStore } from '@/lib/store'

export function EventRoom() {
  const activeEventId = useAppStore((s) => s.activeEventId)

  return (
    <group>
      <ambientLight intensity={0.6} />
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="hotpink" />
      </mesh>
    </group>
  )
}
