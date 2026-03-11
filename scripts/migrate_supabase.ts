import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
    console.log('Connecting to', process.env.PGHOST, 'for Supabase Migration');
    const sql = postgres({
        host: process.env.PGHOST,
        port: Number(process.env.PGPORT),
        database: process.env.PGDATABASE,
        username: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        ssl: { rejectUnauthorized: false },
        max: 1
    });

    try {
        const sqlPath = path.join(__dirname, 'sql', '001_init_supabase.sql');
        console.log('Reading 001_init_supabase.sql');
        const query1 = fs.readFileSync(sqlPath, 'utf8');
        console.log('Executing 001_init_supabase.sql...');
        await sql.unsafe(query1);
        
        console.log('Creating chat_messages table...');
        await sql`
            CREATE TABLE IF NOT EXISTS chat_messages (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                role VARCHAR(10) CHECK (role IN ('user', 'ai')),
                content TEXT NOT NULL,
                conversation_id VARCHAR(255),
                created_at TIMESTAMP DEFAULT NOW()
            );
        `;
        await sql`
            CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id, created_at ASC);
        `;
        console.log('001_init_supabase.sql and chat_messages completed successfully (Migration Finished).');
    } catch (error: any) {
        console.error('Migration failed:');
        console.error(error?.message || error);
    } finally {
        await sql.end();
    }
}

main();
