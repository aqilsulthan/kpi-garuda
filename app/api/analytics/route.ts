// app/api/analysis/route.ts — CRUD analysis_drafts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import sql from '@/lib/db'

// GET — ambil draft analisis berdasarkan dept_id + period
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dept_id = req.nextUrl.searchParams.get('dept_id')
  const period  = req.nextUrl.searchParams.get('period')
  if (!dept_id || !period) {
    return NextResponse.json({ error: 'dept_id dan period wajib.' }, { status: 400 })
  }

  const [draft] = await sql`
    SELECT * FROM analysis_drafts
    WHERE dept_id = ${dept_id} AND period = ${period}
    LIMIT 1
  `
  return NextResponse.json(draft ?? null)
}

// POST — simpan atau publish draft analisis
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || !['admin', 'corporate_planning'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { dept_id, period, entity_type, ai_content, action } = await req.json()

  if (!dept_id || !period || !ai_content) {
    return NextResponse.json({ error: 'dept_id, period, ai_content wajib.' }, { status: 400 })
  }

  const status      = action === 'publish' ? 'published' : 'draft'
  const published_at = action === 'publish' ? new Date().toISOString() : null

  try {
    await sql`
      INSERT INTO analysis_drafts (
        entity_type, dept_id, period, ai_content,
        status, published_at, created_by
      ) VALUES (
        ${entity_type ?? 'department'}, ${dept_id}, ${period}, ${ai_content},
        ${status}, ${published_at}, ${session.user.id}
      )
      ON CONFLICT (dept_id, period)
      DO UPDATE SET
        ai_content   = EXCLUDED.ai_content,
        status       = EXCLUDED.status,
        published_at = EXCLUDED.published_at,
        updated_at   = NOW()
    `
    return NextResponse.json({ ok: true, status })
  } catch (e) {
    console.error('analysis POST error:', e)
    return NextResponse.json({ error: 'Gagal menyimpan.' }, { status: 500 })
  }
}
