'use client'

import { useAppStore } from '@/lib/store'
import { START_YEAR, END_YEAR } from '@/lib/three/era'

const YEARS = Array.from({ length: END_YEAR - START_YEAR + 1 }, (_, i) => START_YEAR + i)

export function TimelineSidebar() {
  const currentYear = useAppStore((s) => s.currentYear)
  const scrollProgress = useAppStore((s) => s.scrollProgress)
  const navigation = useAppStore((s) => s.navigation)

  if (navigation === 'room') return null

  const cursorPercent = scrollProgress * 100

  return (
    <div className="fixed right-6 top-1/2 z-50 -translate-y-1/2" style={{ height: '60vh' }}>
      <div className="relative h-full w-1 rounded-full bg-white/30">
        {/* Cursor */}
        <div
          className="absolute left-1/2 -translate-x-1/2 transition-[top] duration-200 ease-out"
          style={{ top: `${cursorPercent}%` }}
        >
          <div
            className="glass-panel flex h-8 items-center gap-2 whitespace-nowrap px-3 text-sm font-semibold"
            style={{ fontFamily: 'var(--font-title)' }}
          >
            {currentYear}
          </div>
        </div>

        {/* Year ticks */}
        {YEARS.map((year) => {
          const percent = ((year - START_YEAR) / (END_YEAR - START_YEAR)) * 100
          return (
            <div
              key={year}
              className="absolute left-1/2 h-0.5 w-3 -translate-x-1/2 bg-white/40"
              style={{ top: `${percent}%` }}
            />
          )
        })}
      </div>
    </div>
  )
}
