export type EventCategory =
  | 'fiscalite'
  | 'emploi'
  | 'crise'
  | 'reforme'
  | 'social'
  | 'international'

export interface TimelineEvent {
  date: string
  title: string
  description: string
  category: EventCategory
  indicatorNames: string[]
  sources: string[]
  displayOrder: number
}
