'use client'

import { MainCanvas } from '@/components/three/canvas/MainCanvas'
import { TimelineSidebar } from '@/components/ui/TimelineSidebar'
import { RoomHUD } from '@/components/ui/RoomHUD'
import { DataLoader } from '@/components/three/canvas/DataLoader'

export default function ExperiencePage() {
  return (
    <>
      <a
        href="#main-canvas"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:shadow"
      >
        Aller au contenu principal
      </a>
      <DataLoader />
      <main id="main-canvas" role="main" aria-label="Timeline interactive 3D des mandats Macron">
        <MainCanvas />
      </main>
      <nav aria-label="Navigation temporelle">
        <TimelineSidebar />
      </nav>
      <RoomHUD />
    </>
  )
}
