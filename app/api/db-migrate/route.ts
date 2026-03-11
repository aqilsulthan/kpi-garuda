import { NextResponse } from 'next/server'
import sql from '@/lib/db'

export async function GET() {
  try {
        await sql`
            CREATE TABLE IF NOT EXISTS chat_messages (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                role VARCHAR(10) CHECK (role IN ('user', 'ai')),
                content TEXT NOT NULL,
                conversation_id VARCHAR(255),
                created_at TIMESTAMP DEFAULT NOW()
            );
        `
        await sql`
            CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id, created_at ASC);
        `
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
