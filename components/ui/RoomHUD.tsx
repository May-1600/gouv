'use client'

import { useAppStore } from '@/lib/store'
import { useRoomData } from '@/lib/hooks/useRoomData'

export function RoomHUD() {
  const navigation = useAppStore((s) => s.navigation)
  const activeEventId = useAppStore((s) => s.activeEventId)
  const exitRoom = useAppStore((s) => s.exitRoom)
  const { data, loading } = useRoomData(activeEventId)

  if (navigation !== 'room') return null

  return (
    <div className="fixed inset-x-0 top-0 z-50 p-6">
      <div className="flex items-start justify-between">
        {/* Event info */}
        <div className="glass-panel max-w-lg p-6">
          {loading ? (
            <p className="text-sm text-gray-500">Chargement…</p>
          ) : data ? (
            <>
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">
                {data.event.date} — {data.event.category}
              </p>
              <h2
                className="mb-2 text-2xl font-bold"
                style={{ fontFamily: 'var(--font-title)' }}
              >
                {data.event.title}
              </h2>
              <p className="text-sm leading-relaxed text-gray-700">
                {data.event.description}
              </p>
              {data.event.sources && data.event.sources.length > 0 && (
                <div className="mt-3 flex gap-2">
                  {data.event.sources.map((src, i) => (
                    <a
                      key={i}
                      href={src}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 underline"
                    >
                      Source {i + 1}
                    </a>
                  ))}
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Back button */}
        <button
          onClick={exitRoom}
          className="glass-panel px-5 py-3 text-sm font-semibold transition-transform hover:scale-105"
          style={{ fontFamily: 'var(--font-title)' }}
        >
          ← Retour à la timeline
        </button>
      </div>
    </div>
  )
}
