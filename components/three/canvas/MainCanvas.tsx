'use client'

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { CanvasErrorBoundary } from './CanvasErrorBoundary'
import { LoadingScreen } from './LoadingScreen'
import { Timeline } from '@/components/three/world/Timeline'

export function MainCanvas() {
  return (
    <CanvasErrorBoundary>
      <div className="fixed inset-0">
        <Suspense fallback={<LoadingScreen />}>
          <Canvas
            camera={{ fov: 60, near: 0.1, far: 200, position: [0, 3, 0] }}
            shadows
            dpr={[1, 2]}
            gl={{ antialias: true }}
          >
            <Timeline />
          </Canvas>
        </Suspense>
      </div>
    </CanvasErrorBoundary>
  )
}
