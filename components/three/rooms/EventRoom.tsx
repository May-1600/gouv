'use client'

import * as THREE from 'three'
import { OrbitControls } from '@react-three/drei'
import { useAppStore } from '@/lib/store'
import { useRoomData } from '@/lib/hooks/useRoomData'
import { getRoomStyle } from '@/lib/three/room-config'
import { RoomEnvironment, ROOM_WIDTH } from './RoomEnvironment'
import { DataPanel } from '@/components/three/data-viz/DataPanel'
import { DataColumnRow } from '@/components/three/data-viz/DataColumn'
import { NarrativePanel } from '@/components/three/data-viz/NarrativePanel'

export function EventRoom() {
  const activeEventId = useAppStore((s) => s.activeEventId)
  const isTransitioning = useAppStore((s) => s.isTransitioning)
  const { data, loading } = useRoomData(activeEventId)

  const category = data?.event.category ?? null
  const style = getRoomStyle(category)

  return (
    <group>
      <RoomEnvironment style={style} />

      <OrbitControls
        enabled={!isTransitioning}
        target={[0, 2, -1]}
        minDistance={3}
        maxDistance={15}
        maxPolarAngle={Math.PI / 2}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.5}
        touches={{
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_ROTATE,
        }}
      />

      {/* Data visualizations — only when data is loaded */}
      {data && data.indicators.length > 0 && (
        <group>
          {/* DataPanels: arranged along the back wall */}
          {data.indicators.map((indicator, i) => {
            const totalPanels = data.indicators.length
            const spacing = Math.min(ROOM_WIDTH / (totalPanels + 1), 6)
            const x = (i - (totalPanels - 1) / 2) * spacing
            return (
              <DataPanel
                key={indicator.name}
                indicator={indicator}
                eventDate={data.event.date}
                position={[x, 3.5, -5]}
              />
            )
          })}

          {/* DataColumnRows: on the floor, one per indicator */}
          {data.indicators.map((indicator, i) => {
            const totalRows = data.indicators.length
            const spacing = Math.min(ROOM_WIDTH / (totalRows + 1), 6)
            const x = (i - (totalRows - 1) / 2) * spacing
            return (
              <DataColumnRow
                key={indicator.name}
                data={indicator.data}
                eventDate={data.event.date}
                color={indicator.color}
                position={[x, 0, 0]}
              />
            )
          })}

          {/* Narrative panels: positioned to the right side of the room */}
          {data.narratives && data.narratives.length > 0 &&
            data.narratives.map((narrative, i) => {
              const indicator = data.indicators.find(
                (ind) => ind.name === narrative.indicatorName
              )
              if (!indicator) return null
              return (
                <NarrativePanel
                  key={narrative.indicatorName}
                  narrative={narrative}
                  indicatorLabel={indicator.label}
                  indicatorColor={indicator.color}
                  position={[6, 3 - i * 2.5, -2]}
                />
              )
            })}
        </group>
      )}

      {/* Loading indicator */}
      {loading && (
        <mesh position={[0, 2, 0]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial color="#a78bfa" emissive="#a78bfa" emissiveIntensity={0.5} />
        </mesh>
      )}
    </group>
  )
}
