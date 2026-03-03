'use client'

import { useProgress } from '@react-three/drei'

export function LoadingScreen() {
  const { progress } = useProgress()

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--background)]">
      <div className="glass-panel w-80 p-8 text-center">
        <h2
          className="mb-6 text-2xl font-semibold"
          style={{ fontFamily: 'var(--font-title)' }}
        >
          Chrono-Macron
        </h2>
        <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-[var(--era-optimism)] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-500">
          Chargement du monde… {Math.round(progress)}%
        </p>
      </div>
    </div>
  )
}
