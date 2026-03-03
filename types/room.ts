/** A single data point in an indicator series */
export interface DataPoint {
  date: string
  value: number
}

/** An indicator series with metadata, as returned by /api/events/:id */
export interface RoomIndicator {
  name: string
  label: string
  unit: string
  color: string
  impactDescription: string | null
  data: DataPoint[]
}

/** Narrative analysis for an indicator around an event */
export interface RoomNarrative {
  indicatorName: string
  before: string | null
  analysis: string | null
  comparison: string | null
  projection: string | null
}

/** Full room data payload */
export interface RoomData {
  event: {
    id: string
    date: string
    title: string
    description: string | null
    category: string | null
    sources: string[] | null
  }
  indicators: RoomIndicator[]
  narratives: RoomNarrative[]
}
