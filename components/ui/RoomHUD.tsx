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
    <div className="fixed inset-x-0 top-0 z-50 p-4 sm:p-6" role="region" aria-label="Détails de l'événement">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        {/* Event info */}
        <div className="glass-panel max-w-lg p-4 sm:p-6">
          {loading ? (
            <p className="text-sm text-gray-500">Chargement…</p>
          ) : data ? (
            <>
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">
                {data.event.date} — {data.event.category}
              </p>
              <h2
                className="mb-2 text-lg font-bold sm:text-2xl"
                style={{ fontFamily: 'var(--font-title)' }}
              >
                {data.event.title}
              </h2>
              <p className="hidden text-sm leading-relaxed text-gray-700 sm:block">
                {data.event.description}
              </p>
              {data.event.sources && data.event.sources.length > 0 && (
                <div className="mt-3 hidden gap-2 sm:flex">
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
          className="glass-panel px-4 py-2 text-sm font-semibold transition-transform hover:scale-105 sm:px-5 sm:py-3"
          style={{ fontFamily: 'var(--font-title)' }}
          aria-label="Retour à la timeline"
        >
          ← Retour
        </button>
      </div>
    </div>
  )
}
