import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import sql from '../lib/db'

async function db_test() {
   try {
     const res = await sql`SELECT 1 as result`
     console.log('SUCCESS:', res)
     process.exit(0)
   } catch(e) {
     console.error('ERROR:', e)
     process.exit(1)
   }
}
db_test()
