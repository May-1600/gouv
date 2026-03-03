import { create } from 'zustand'
import type { Indicator, Event } from '@/types/database'

type NavigationState = 'timeline' | 'room'

interface AppState {
  // Navigation
  navigation: NavigationState
  scrollProgress: number
  currentYear: number
  activeEventId: string | null

  // Camera transition
  isTransitioning: boolean
  transitionProgress: number

  // Data
  indicators: Map<string, Indicator[]>
  events: Event[]
  isLoading: boolean

  // Actions
  setScrollProgress: (progress: number) => void
  enterRoom: (eventId: string) => void
  exitRoom: () => void
  setTransitionProgress: (progress: number) => void
  startTransition: () => void
  endTransition: () => void
  setIndicators: (name: string, data: Indicator[]) => void
  setEvents: (events: Event[]) => void
  setLoading: (loading: boolean) => void
}

const START_YEAR = 2017
const END_YEAR = 2026

export const useAppStore = create<AppState>((set) => ({
  navigation: 'timeline',
  scrollProgress: 0,
  currentYear: START_YEAR,
  activeEventId: null,
  isTransitioning: false,
  transitionProgress: 0,
  indicators: new Map(),
  events: [],
  isLoading: true,

  setScrollProgress: (progress) =>
    set({
      scrollProgress: progress,
      currentYear: Math.floor(START_YEAR + progress * (END_YEAR - START_YEAR)),
    }),

  enterRoom: (eventId) =>
    set({ navigation: 'room', activeEventId: eventId, isTransitioning: true, transitionProgress: 0 }),

  exitRoom: () =>
    set({ navigation: 'timeline', activeEventId: null, isTransitioning: true, transitionProgress: 0 }),

  setTransitionProgress: (progress) =>
    set({ transitionProgress: progress }),

  startTransition: () =>
    set({ isTransitioning: true, transitionProgress: 0 }),

  endTransition: () =>
    set({ isTransitioning: false, transitionProgress: 1 }),

  setIndicators: (name, data) =>
    set((state) => {
      const next = new Map(state.indicators)
      next.set(name, data)
      return { indicators: next }
    }),

  setEvents: (events) => set({ events }),

  setLoading: (loading) => set({ isLoading: loading }),
}))
