'use client'

import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { useAppStore } from '@/lib/store'

export function Effects() {
  const navigation = useAppStore((s) => s.navigation)

  return (
    <EffectComposer>
      <Bloom
        intensity={navigation === 'room' ? 0.3 : 0.5}
        luminanceThreshold={0.6}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
      <Vignette
        offset={0.3}
        darkness={navigation === 'room' ? 0.4 : 0.3}
      />
    </EffectComposer>
  )
}
