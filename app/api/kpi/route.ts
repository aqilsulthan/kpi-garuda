// app/api/kpi/route.ts — GET kpi_items + actuals
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getDeptScorecard, getAllScorecards } from '@/lib/calc'

// GET /api/kpi?period=2025-03              → semua scorecard
// GET /api/kpi?period=2025-03&dept_id=xxx  → scorecard satu dept
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const period  = req.nextUrl.searchParams.get('period')
  const dept_id = req.nextUrl.searchParams.get('dept_id')

  if (!period) {
    return NextResponse.json({ error: 'period wajib.' }, { status: 400 })
  }

  try {
    if (dept_id) {
      const scorecard = await getDeptScorecard(dept_id, period)
      return NextResponse.json(scorecard)
    } else {
      const scorecards = await getAllScorecards(period)
      return NextResponse.json(scorecards)
    }
  } catch (e) {
    console.error('kpi GET error:', e)
    return NextResponse.json({ error: 'Gagal mengambil data.' }, { status: 500 })
  }
}
