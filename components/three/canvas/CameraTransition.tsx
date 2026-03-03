'use client'

import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useAppStore } from '@/lib/store'
import { getCameraPosition, getLookAtTarget } from '@/lib/three/camera-path'
import { useReducedMotion } from '@/lib/hooks/useReducedMotion'

const ROOM_CAMERA_POS = new THREE.Vector3(0, 5, 10)
const ROOM_LOOK_AT = new THREE.Vector3(0, 2, -1)
const TRANSITION_SPEED = 2.5

export function CameraTransition() {
  const { camera } = useThree()
  const reducedMotion = useReducedMotion()
  const isTransitioning = useAppStore((s) => s.isTransitioning)
  const navigation = useAppStore((s) => s.navigation)
  const scrollProgress = useAppStore((s) => s.scrollProgress)
  const setTransitionProgress = useAppStore((s) => s.setTransitionProgress)
  const endTransition = useAppStore((s) => s.endTransition)

  const progressRef = useRef(0)
  const fromPos = useRef(new THREE.Vector3())
  const fromTarget = useRef(new THREE.Vector3())
  const toPos = useRef(new THREE.Vector3())
  const toTarget = useRef(new THREE.Vector3())
  const initialized = useRef(false)

  useFrame((_, delta) => {
    if (!isTransitioning) {
      initialized.current = false
      return
    }

    if (!initialized.current) {
      initialized.current = true
      progressRef.current = 0

      if (navigation === 'room') {
        fromPos.current.copy(camera.position)
        fromTarget.current.copy(getLookAtTarget(scrollProgress))
        toPos.current.copy(ROOM_CAMERA_POS)
        toTarget.current.copy(ROOM_LOOK_AT)
      } else {
        fromPos.current.copy(camera.position)
        fromTarget.current.copy(ROOM_LOOK_AT)
        const timelinePos = getCameraPosition(scrollProgress)
        toPos.current.set(timelinePos.x, timelinePos.y, timelinePos.z)
        toTarget.current.copy(getLookAtTarget(scrollProgress))
      }
    }

    if (reducedMotion) {
      progressRef.current = 1
    } else {
      progressRef.current = Math.min(1, progressRef.current + delta * TRANSITION_SPEED)
    }
    const t = easeInOutCubic(progressRef.current)

    camera.position.lerpVectors(fromPos.current, toPos.current, t)
    const currentTarget = new THREE.Vector3().lerpVectors(
      fromTarget.current,
      toTarget.current,
      t
    )
    camera.lookAt(currentTarget)

    setTransitionProgress(t)

    if (progressRef.current >= 1) {
      endTransition()
    }
  })

  return null
}

function easeInOutCubic(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2
}
