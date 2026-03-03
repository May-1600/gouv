'use client'

import { ScrollControls } from '@react-three/drei'
import { CameraRig } from './CameraRig'
import { Terrain } from './Terrain'
import { YearMarkers } from './YearMarkers'
import { EventMarkers } from './EventMarkers'
import { Atmosphere } from './Atmosphere'

export function Timeline() {
  return (
    <ScrollControls pages={10} damping={0.15}>
      <CameraRig />
      <Terrain />
      <YearMarkers />
      <EventMarkers />
      <Atmosphere />
    </ScrollControls>
  )
}
