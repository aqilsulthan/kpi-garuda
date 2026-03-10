import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
    console.log('Connecting to', process.env.PGHOST, 'for PostgreSQL Migration');
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
        const sqlPath = path.join(__dirname, 'sql', '001_init.sql');
        console.log('Reading 001_init.sql');
        const query1 = fs.readFileSync(sqlPath, 'utf8');
        console.log('Executing 001_init.sql...');
        await sql.unsafe(query1);
        console.log('001_init.sql completed successfully (Migration Finished).');
    } catch (error: any) {
        console.error('Migration failed:');
        console.error(error?.message || error);
    } finally {
        await sql.end();
    }
}

main();
