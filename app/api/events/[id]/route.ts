import { NextRequest, NextResponse } from 'next/server'
import { getEventWithIndicators, getIndicatorSeries } from '@/lib/queries'
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

    return NextResponse.json({
      event,
      indicators: indicatorSeries,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
