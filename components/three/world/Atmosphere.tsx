'use client'

import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Sky } from '@react-three/drei'
import * as THREE from 'three'
import { useAppStore } from '@/lib/store'
import { getEraConfig } from '@/lib/three/era'

export function Atmosphere() {
  const lightRef = useRef<THREE.DirectionalLight>(null)
  const currentYear = useAppStore((s) => s.currentYear)
  const { scene } = useThree()

  useFrame(() => {
    const era = getEraConfig(currentYear)

    scene.fog = new THREE.FogExp2(era.fogColor, era.fogDensity)
    scene.background = new THREE.Color(era.skyColor)

    if (lightRef.current) {
      lightRef.current.intensity = era.lightIntensity
    }
  })

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        ref={lightRef}
        position={[50, 30, 20]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={150}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <Sky
        distance={450000}
        sunPosition={[100, 40, 50]}
        inclination={0.5}
        azimuth={0.25}
      />
    </>
  )
}
