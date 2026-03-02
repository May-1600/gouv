import { NextRequest, NextResponse } from 'next/server'
import { getIndicatorSeries, getEvents } from '@/lib/queries'

/**
 * GET /api/indicators?name=pib&country=FR&start=2017-01-01&end=2026-12-31
 * GET /api/indicators?type=events
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')

  try {
    if (type === 'events') {
      const events = await getEvents()
      return NextResponse.json(events)
    }

    const name = searchParams.get('name')
    if (!name) {
      return NextResponse.json(
        { error: 'Missing required parameter: name' },
        { status: 400 }
      )
    }

    const country = searchParams.get('country') || 'FR'
    const start = searchParams.get('start') || undefined
    const end = searchParams.get('end') || undefined

    const data = await getIndicatorSeries(name, country, start, end)
    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
