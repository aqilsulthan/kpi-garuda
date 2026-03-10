import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import sql from '@/lib/db'

export async function PATCH(req: Request) {
    try {
        const session = await auth()
        if (session?.user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const { id, is_active, role } = await req.json()
        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

        await sql`
      UPDATE users 
      SET is_active = ${is_active}, role = ${role}, updated_at = NOW()
      WHERE id = ${id}
    `

        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error('Update user error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
