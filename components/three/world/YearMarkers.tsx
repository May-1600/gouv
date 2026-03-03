'use client'

import { Text } from '@react-three/drei'
import { yearToPathPosition } from '@/lib/three/camera-path'
import { START_YEAR, END_YEAR } from '@/lib/three/era'

export function YearMarkers() {
  const years = Array.from(
    { length: END_YEAR - START_YEAR + 1 },
    (_, i) => START_YEAR + i
  )

  return (
    <group>
      {years.map((year) => {
        const pos = yearToPathPosition(year)
        return (
          <Text
            key={year}
            position={[pos.x, 0.2, pos.z - 3.5]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={0.8}
            color="#1a1a2e"
            anchorX="center"
            anchorY="middle"
            fillOpacity={0.6}
          >
            {String(year)}
          </Text>
        )
      })}
    </group>
  )
}
