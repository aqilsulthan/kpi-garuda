import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { upsertExternalData, deleteExternalData } from '@/lib/external-db'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || !['admin', 'corporate_planning'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { period, data_type, value, unit, notes, source } = await req.json()

    if (!period || !data_type || value === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    await upsertExternalData([{
      period,
      data_type,
      value: Number(value),
      unit: unit || null,
      notes: notes || null,
      source: source || 'manual',
      created_by: session.user.id
    }])

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth()
    if (!session || !['admin', 'corporate_planning'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { period, data_type } = await req.json()

    if (!period || !data_type) {
      return NextResponse.json({ error: 'Missing period or data_type' }, { status: 400 })
    }

    await deleteExternalData(period, data_type)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
