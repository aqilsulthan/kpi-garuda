import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import sql from '@/lib/db'
import type { UploadRequest } from '@/types'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body: UploadRequest = await req.json()
  const { entity_type, dept_id, period, kpi_items, actuals } = body

  if (!entity_type || !dept_id || !period || !kpi_items?.length) {
    return NextResponse.json({ error: 'Data tidak lengkap.' }, { status: 400 })
  }

  let inserted = 0
  let actualsInserted = 0

  try {
    await sql.begin(async tx => {
      // Hapus actuals lama untuk KPI items di dept + period ini
      await (tx as any)`
        DELETE FROM kpi_actuals
        WHERE period = ${period}
          AND kpi_item_id IN (
            SELECT id FROM kpi_items WHERE dept_id = ${dept_id} AND period = ${period}
          )
      `

      // Hapus data lama untuk dept + period ini (upsert manual)
      await (tx as any)`
        DELETE FROM kpi_items WHERE dept_id = ${dept_id} AND period = ${period}
      `

      // Map untuk menyimpan action_verb → kpi_item_id baru
      const actionVerbToId = new Map<string, string>()
      const normalizeStr = (s: string) => s.toLowerCase().replace(/[\s\r\n]+/g, '')

      for (const item of kpi_items) {
        const [row] = await (tx as any)`
          INSERT INTO kpi_items (
            entity_type, dept_id, period,
            no, objective, action_verb,
            target_from, target_to, parameter,
            bobot, polaritas, cascaded_from,
            key_drivers, remarks
          ) VALUES (
            ${entity_type}, ${dept_id}, ${period},
            ${item.no}, ${item.objective}, ${item.action_verb},
            ${item.target_from}, ${item.target_to}, ${item.parameter},
            ${item.bobot}, ${item.polaritas}, ${item.cascaded_from},
            ${item.key_drivers}, ${item.remarks}
          ) RETURNING id
        `
        actionVerbToId.set(normalizeStr(item.action_verb), row.id)
        inserted++
      }

      // Insert actuals dari score_kpi sheet
      if (actuals && actuals.length > 0) {
        for (const actual of actuals) {
          const kpiItemId = actionVerbToId.get(normalizeStr(actual.action_verb))
          if (!kpiItemId) continue

          await (tx as any)`
            INSERT INTO kpi_actuals (
              kpi_item_id, actual_value, period, source, input_by
            ) VALUES (
              ${kpiItemId}, ${actual.actual_value}, ${period},
              'excel_import', ${session.user.id}
            )
          `
          actualsInserted++
        }
      }

      // Log upload
      await (tx as any)`
        INSERT INTO upload_logs (
          filename, entity_type, dept_id, period,
          items_parsed, actuals_parsed, status, uploaded_by
        ) VALUES (
          ${'excel-upload'}, ${entity_type}, ${dept_id}, ${period},
          ${inserted}, ${actualsInserted}, 'success', ${session.user.id}
        )
      `
    })

    return NextResponse.json({ ok: true, inserted, actualsInserted })
  } catch (e) {
    console.error('parse-excel error:', e)
    return NextResponse.json({ error: 'Gagal menyimpan ke database.' }, { status: 500 })
  }
}
