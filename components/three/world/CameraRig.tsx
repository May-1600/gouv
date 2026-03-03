'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import { getCameraPosition, getLookAtTarget } from '@/lib/three/camera-path'
import { useAppStore } from '@/lib/store'

export function CameraRig() {
  const scroll = useScroll()
  const { camera } = useThree()
  const setScrollProgress = useAppStore((s) => s.setScrollProgress)

  useFrame(() => {
    const offset = scroll.offset

    const pos = getCameraPosition(offset)
    camera.position.copy(pos)

    const target = getLookAtTarget(offset)
    camera.lookAt(target)

    setScrollProgress(offset)
  })

  return null
}
