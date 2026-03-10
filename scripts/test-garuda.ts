import postgres from 'postgres';

const sql = postgres({
    host: 'gp-d9j171o6khe6g3r61-master.gpdbmaster.ap-southeast-5.rds.aliyuncs.com',
    port: 5432,
    database: 'dbinternal_adb_pg',
    username: 'dify_poc',
    password: 'd!fypocHore123!',
    ssl: { rejectUnauthorized: false },
    max: 1,
    connect_timeout: 5,
});

async function main() {
    try {
        console.log('Connecting to Garuda DB...');
        const result = await sql`SELECT 1 as result`;
        console.log('Success:', result[0]);
    } catch (e) {
        console.error('Error:', e);
    } finally {
        process.exit(0);
    }
}

main();
