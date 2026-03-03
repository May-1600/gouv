import { NextRequest, NextResponse } from 'next/server'
import { getEventWithIndicators, getIndicatorSeries, getNarrative } from '@/lib/queries'
import { getIndicatorConfig } from '@/data/indicator-config'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const { event, indicators: eventIndicators } = await getEventWithIndicators(id)

    const indicatorSeries = await Promise.all(
      eventIndicators.map(async (ei) => {
        const config = getIndicatorConfig(ei.indicator_name)
        const series = await getIndicatorSeries(
          ei.indicator_name,
          'FR',
          '2017-01-01',
          '2026-12-31'
        )
        return {
          name: ei.indicator_name,
          label: config?.label ?? ei.indicator_name,
          unit: config?.unit ?? '',
          color: config?.color ?? '#8b5cf6',
          impactDescription: ei.impact_description,
          data: series.map((s) => ({
            date: s.date,
            value: s.value,
          })),
        }
      })
    )

    // Fetch narratives for each indicator (may not exist for all)
    const eventYear = new Date(event.date).getFullYear()
    const narratives = (
      await Promise.all(
        eventIndicators.map(async (ei) => {
          const narrative = await getNarrative(
            ei.indicator_name,
            `${eventYear - 1}-01-01`,
            `${eventYear + 1}-12-31`
          )
          if (!narrative) return null
          return {
            indicatorName: ei.indicator_name,
            before: narrative.content_before,
            analysis: narrative.content_analysis,
            comparison: narrative.content_comparison,
            projection: narrative.content_projection,
          }
        })
      )
    ).filter((n): n is NonNullable<typeof n> => n !== null)

    return NextResponse.json({
      event,
      indicators: indicatorSeries,
      narratives,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
