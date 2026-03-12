import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import sql from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { items } = await req.json() as { items: { dept_id: string; period: string }[] }
  
  if (!items || !items.length) {
    return NextResponse.json({ results: [] })
  }

  try {
    const results = await Promise.all(items.map(async (item) => {
      // Check if data exists for this dept and period
      const [row] = await sql`
        SELECT id FROM kpi_items 
        WHERE dept_id = ${item.dept_id} AND period = ${item.period} 
        LIMIT 1
      `
      return {
        dept_id: item.dept_id,
        period: item.period,
        exists: !!row
      }
    }))

    return NextResponse.json({ results })
  } catch (e) {
    console.error('check-exists error:', e)
    return NextResponse.json({ error: 'Gagal mengecek data di database.' }, { status: 500 })
  }
}
