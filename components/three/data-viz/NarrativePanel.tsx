'use client'

import { Html } from '@react-three/drei'
import type { RoomNarrative } from '@/types/room'

interface NarrativePanelProps {
  narrative: RoomNarrative
  indicatorLabel: string
  indicatorColor: string
  position: [number, number, number]
}

export function NarrativePanel({
  narrative,
  indicatorLabel,
  indicatorColor,
  position,
}: NarrativePanelProps) {
  const sections = [
    { key: 'before', label: 'Avant', content: narrative.before },
    { key: 'analysis', label: 'Analyse', content: narrative.analysis },
    { key: 'comparison', label: 'Comparaison', content: narrative.comparison },
    { key: 'projection', label: 'Projection', content: narrative.projection },
  ].filter((s) => s.content)

  if (sections.length === 0) return null

  return (
    <Html
      position={position}
      transform
      distanceFactor={8}
      style={{ pointerEvents: 'auto' }}
    >
      <div
        className="glass-panel w-[320px] p-5"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        <h3
          className="mb-3 text-sm font-semibold"
          style={{ fontFamily: 'var(--font-title)', color: indicatorColor }}
        >
          Analyse — {indicatorLabel}
        </h3>

        <div className="space-y-3">
          {sections.map((section) => (
            <div key={section.key}>
              <p
                className="mb-1 text-xs font-medium uppercase tracking-wider"
                style={{ color: indicatorColor }}
              >
                {section.label}
              </p>
              <p className="text-xs leading-relaxed text-gray-700">
                {section.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Html>
  )
}
