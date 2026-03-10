// scripts/seed_pg.ts
// Jalankan: npx tsx scripts/seed_pg.ts
// Mengisi data awal: admin user + departments (hirarki PTX) + kpi_dictionary
// Membaca query dari scripts/sql/002_seed.sql

import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
    console.log('🌱 [seed_pg] Menjalankan seed data...');
    console.log(`   Host: ${process.env.PGHOST}`);
    console.log(`   DB  : ${process.env.PGDATABASE}\n`);

    const sql = postgres({
        host: process.env.PGHOST,
        port: Number(process.env.PGPORT ?? 5432),
        database: process.env.PGDATABASE,
        username: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        ssl: { rejectUnauthorized: false },
        max: 1,
        connect_timeout: 15,
    });

    try {
        const seedPath = path.join(__dirname, 'sql', '002_seed.sql');
        if (!fs.existsSync(seedPath)) {
            console.error('❌ File tidak ditemukan:', seedPath);
            process.exit(1);
        }

        console.log('📄 Membaca 002_seed.sql...');
        const query = fs.readFileSync(seedPath, 'utf8');

        console.log('⏳ Mengeksekusi SQL seed...');
        await sql.unsafe(query);
        console.log('✅ 002_seed.sql berhasil dieksekusi!\n');

        // Tampilkan ringkasan
        const [userCount] = await sql`SELECT COUNT(*) FROM users`;
        const [deptCount] = await sql`SELECT COUNT(*) FROM departments`;
        const [dictCount] = await sql`SELECT COUNT(*) FROM kpi_dictionary`;

        console.log('📊 Ringkasan Data:');
        console.log(`   Users       : ${userCount.count}`);
        console.log(`   Departments : ${deptCount.count}`);
        console.log(`   KPI Dict    : ${dictCount.count}`);
        console.log('\n⚠️  PENTING: Ganti password admin setelah login pertama!');
        console.log('   Login: admin@company.com / admin123');
        console.log('\n👉 Jalankan berikutnya: npm run dev');

    } catch (error: any) {
        console.error('\n❌ Seed gagal:', error?.message || error);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

main();
