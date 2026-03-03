'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'

const INDICATOR_NAMES = ['pib', 'chomage', 'inflation_ipc']

export function DataLoader() {
  const setIndicators = useAppStore((s) => s.setIndicators)
  const setEvents = useAppStore((s) => s.setEvents)
  const setLoading = useAppStore((s) => s.setLoading)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const indicatorPromises = INDICATOR_NAMES.map(async (name) => {
          const res = await fetch(
            `/api/indicators?name=${name}&country=FR&start=2017-01-01&end=2026-12-31`
          )
          if (!res.ok) throw new Error(`Failed to fetch ${name}`)
          const data = await res.json()
          return { name, data }
        })

        const eventsPromise = fetch('/api/indicators?type=events').then((r) => {
          if (!r.ok) throw new Error('Failed to fetch events')
          return r.json()
        })

        const [indicators, events] = await Promise.all([
          Promise.all(indicatorPromises),
          eventsPromise,
        ])

        for (const { name, data } of indicators) {
          setIndicators(name, data)
        }
        setEvents(events)
      } catch (err) {
        console.error('DataLoader error:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [setIndicators, setEvents, setLoading])

  return null
}
