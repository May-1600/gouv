import { supabase } from './supabase'
import type { Indicator, Event, EventIndicator, Narrative } from '@/types/database'

export async function getIndicatorSeries(
  name: string,
  country = 'FR',
  startDate?: string,
  endDate?: string
): Promise<Indicator[]> {
  let query = supabase
    .from('indicators')
    .select('*')
    .eq('name', name)
    .eq('country', country)
    .order('date', { ascending: true })

  if (startDate) query = query.gte('date', startDate)
  if (endDate) query = query.lte('date', endDate)

  const { data, error } = await query
  if (error) throw new Error(`Failed to fetch ${name}: ${error.message}`)
  return data as Indicator[]
}

export async function getEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('display_order', { ascending: true })

  if (error) throw new Error(`Failed to fetch events: ${error.message}`)
  return data as Event[]
}

export async function getEventWithIndicators(eventId: string): Promise<{
  event: Event
  indicators: EventIndicator[]
}> {
  const [eventRes, indicatorsRes] = await Promise.all([
    supabase.from('events').select('*').eq('id', eventId).single(),
    supabase.from('event_indicators').select('*').eq('event_id', eventId),
  ])

  if (eventRes.error) throw new Error(eventRes.error.message)
  if (indicatorsRes.error) throw new Error(indicatorsRes.error.message)

  return {
    event: eventRes.data as Event,
    indicators: indicatorsRes.data as EventIndicator[],
  }
}

export async function getNarrative(
  indicatorName: string,
  periodStart: string,
  periodEnd: string
): Promise<Narrative | null> {
  const { data, error } = await supabase
    .from('narratives')
    .select('*')
    .eq('indicator_name', indicatorName)
    .eq('period_start', periodStart)
    .eq('period_end', periodEnd)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data as Narrative | null
}

export async function getAllIndicatorNames(): Promise<string[]> {
  const { data, error } = await supabase
    .from('indicators')
    .select('name')

  if (error) throw new Error(error.message)
  const unique = [...new Set((data as { name: string }[]).map((d) => d.name))]
  return unique
}
