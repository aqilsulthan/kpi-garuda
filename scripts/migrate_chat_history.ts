import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import sql from '../lib/db'

async function migrate() {
    console.log('Creating chat_messages table...')
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
        console.log('✅ Success: table chat_messages created')
        process.exit(0)
    } catch (err) {
        console.error('❌ Error creating table:', err)
        process.exit(1)
    }
}

migrate()
