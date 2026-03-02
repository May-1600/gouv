import { NextRequest, NextResponse } from 'next/server'
import { runSync } from '@/lib/sync/pipeline'

// Vercel Cron configuration
export const maxDuration = 60

/**
 * POST /api/sync
 * Triggered by Vercel Cron or manually.
 * Protected by CRON_SECRET.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const results = await runSync()
    return NextResponse.json({ results })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
