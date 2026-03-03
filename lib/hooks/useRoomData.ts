'use client'

import { useState, useEffect } from 'react'
import type { RoomData } from '@/types/room'

export function useRoomData(eventId: string | null) {
  const [data, setData] = useState<RoomData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!eventId) {
      setData(null)
      setError(null)
      return
    }

    let cancelled = false

    async function fetchRoomData() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/events/${eventId}`)
        if (!res.ok) throw new Error(`Failed to fetch event: ${res.status}`)
        const json = await res.json()
        if (!cancelled) setData(json)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchRoomData()
    return () => { cancelled = true }
  }, [eventId])

  return { data, loading, error }
}
