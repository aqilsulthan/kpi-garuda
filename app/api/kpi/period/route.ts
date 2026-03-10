import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import sql from '@/lib/db'

export async function DELETE(req: NextRequest) {
    const session = await auth()
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'corporate_planning')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
        const { entity_type, dept_id, period } = await req.json()

        if (!period) {
            return NextResponse.json({ error: 'Periode harus diisi.' }, { status: 400 })
        }

        let deletedRows: any[] = []

        if (dept_id === 'ALL') {
            if (entity_type === 'ALL') {
                deletedRows = await sql`
          DELETE FROM kpi_items WHERE period = ${period} RETURNING id
        `
            } else {
                deletedRows = await sql`
          DELETE FROM kpi_items WHERE entity_type = ${entity_type} AND period = ${period} RETURNING id
        `
            }
        } else {
            if (!entity_type || !dept_id) {
                return NextResponse.json({ error: 'Entitas dan Departemen harus diisi.' }, { status: 400 })
            }
            deletedRows = await sql`
        DELETE FROM kpi_items 
        WHERE entity_type = ${entity_type} AND dept_id = ${dept_id} AND period = ${period}
        RETURNING id
      `
        }

        return NextResponse.json({ ok: true, deletedCount: deletedRows.length })
    } catch (e) {
        console.error('Delete KPI period error:', e)
        return NextResponse.json({ error: 'Gagal menghapus data KPI.' }, { status: 500 })
    }
}
