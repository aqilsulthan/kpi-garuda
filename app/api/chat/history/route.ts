import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import sql from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const messages = await sql`
      SELECT id, role, content, conversation_id, created_at
      FROM chat_messages
      WHERE user_id = ${session.user.id}
      ORDER BY created_at ASC
    `

    // Kumpulkan unique conversation_id untuk memungkinkan fitur multiple sessions nanti
    // Untuk sekarang, kita gabungkan semua untuk konteks, atau client bisa filter.
    return NextResponse.json({ messages })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
