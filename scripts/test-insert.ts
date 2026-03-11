import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import sql from '../lib/db'

async function check() {
    try {
        const id = '6f15f112-aeee-4928-bc3f-1d19be87cae4' // admin id default
        
        await sql`
            INSERT INTO chat_messages (user_id, role, content, conversation_id)
            VALUES 
            (${id}, 'user', 'test query', 'test-conv-1'),
            (${id}, 'ai', 'test answer', 'test-conv-1')
        `
        console.log("Success Insert!")
        
        const rows = await sql`SELECT * FROM chat_messages`
        console.log(rows)
    } catch(e) {
        console.error("error:", e)
    } finally {
        process.exit(0)
    }
}
check()
