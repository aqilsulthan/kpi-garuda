import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import postgres from 'postgres';

const sql = postgres({
    host: process.env.PGHOST!,
    port: Number(process.env.PGPORT ?? 5432),
    database: process.env.PGDATABASE!,
    username: process.env.PGUSER!,
    password: process.env.PGPASSWORD!,
    ssl: { rejectUnauthorized: false },
    max: 1,
    connect_timeout: 5,
});

async function main() {
    try {
        console.log('Connecting to', process.env.PGHOST, 'on port', process.env.PGPORT);
        const result = await sql`SELECT 1 as result`;
        console.log('Success:', result[0]);
    } catch (e) {
        console.error('Error:', e);
    } finally {
        process.exit(0);
    }
}

main();
