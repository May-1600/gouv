'use client'

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { CanvasErrorBoundary } from './CanvasErrorBoundary'
import { LoadingScreen } from './LoadingScreen'
import { Timeline } from '@/components/three/world/Timeline'
import { EventRoom } from '@/components/three/rooms/EventRoom'
import { useAppStore } from '@/lib/store'

function Scene() {
  const navigation = useAppStore((s) => s.navigation)

  if (navigation === 'room') {
    return <EventRoom />
  }

  return <Timeline />
}

export function MainCanvas() {
  return (
    <CanvasErrorBoundary>
      <div className="fixed inset-0">
        <Suspense fallback={<LoadingScreen />}>
          <Canvas
            camera={{ fov: 50, near: 0.1, far: 300, position: [-6, 10, 8] }}
            shadows
            dpr={[1, 2]}
            gl={{ antialias: true }}
          >
            <Scene />
          </Canvas>
        </Suspense>
      </div>
    </CanvasErrorBoundary>
  )
}
