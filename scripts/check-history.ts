import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import sql from '../lib/db'

async function check() {
    try {
        const rows = await sql`SELECT * FROM chat_messages`
        console.log(rows)
    } finally {
        process.exit(0)
    }
}
check()
