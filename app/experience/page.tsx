'use client'

import { MainCanvas } from '@/components/three/canvas/MainCanvas'
import { TimelineSidebar } from '@/components/ui/TimelineSidebar'
import { RoomHUD } from '@/components/ui/RoomHUD'
import { DataLoader } from '@/components/three/canvas/DataLoader'

export default function ExperiencePage() {
  return (
    <>
      <DataLoader />
      <MainCanvas />
      <TimelineSidebar />
      <RoomHUD />
    </>
  )
}
