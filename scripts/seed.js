// scripts/seed.js
// Jalankan: npm run db:seed
// Mengisi data awal: departments (hirarki PTX) + kpi_dictionary + admin user

require('dotenv').config({ path: '.env.local' })
const postgres = require('postgres')

const sql = postgres({
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT ?? 5432),
    database: process.env.PGDATABASE,
    username: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    ssl: { rejectUnauthorized: false },
})

async function seed() {
    console.log('🌱 Menjalankan seed data...')
    console.log(`   Host: ${process.env.PGHOST}`)
    console.log(`   DB  : ${process.env.PGDATABASE}\n`)

    try {

        // ─── 1. ADMIN USER ──────────────────────────────────────────
        console.log('👤 Insert admin user...')
        await sql`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (
        'System Admin',
        'admin@company.com',
        ${process.env.ADMIN_PASSWORD_HASH || '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXIG0yiT4AEy'},
        'admin'
      )
      ON CONFLICT (email) DO NOTHING
    `
        console.log('   ✅ admin@company.com (password: admin123)')

        // ─── 2. DEPARTMENTS — L1 Corporate ──────────────────────────
        console.log('\n🏢 Insert departments...')
        await sql`
      INSERT INTO departments (id, level, name, head_position, unit_name, parent_id)
      VALUES ('00000000-0000-0000-0000-000000000001', 'L1', 'Corporate', 'Chief Executive Officer (CEO)', NULL, NULL)
      ON CONFLICT DO NOTHING
    `
        console.log('   ✅ L1: Corporate')

        // L2: Directors
        await sql`
      INSERT INTO departments (id, level, name, head_position, unit_name, parent_id) VALUES
        ('00000000-0000-0000-0000-000000000002', 'L2', 'Engineering',    'Director of Engineering',        NULL, '00000000-0000-0000-0000-000000000001'),
        ('00000000-0000-0000-0000-000000000003', 'L2', 'Finance',        'Director of Finance',            NULL, '00000000-0000-0000-0000-000000000001'),
        ('00000000-0000-0000-0000-000000000004', 'L2', 'Human Resource', 'Director of Human Resource',     NULL, '00000000-0000-0000-0000-000000000001'),
        ('00000000-0000-0000-0000-000000000005', 'L2', 'IT',             'Chief Information Officer (CIO)',NULL, '00000000-0000-0000-0000-000000000001')
      ON CONFLICT DO NOTHING
    `
        console.log('   ✅ L2: Engineering, Finance, Human Resource, IT')

        // L3: Units — Engineering
        await sql`
      INSERT INTO departments (id, level, name, head_position, unit_name, parent_id) VALUES
        ('00000000-0000-0000-0000-000000000010', 'L3', 'Engineering', 'VP Maintenance & Utility',   'Unit Maintenance & Utility',   '00000000-0000-0000-0000-000000000002'),
        ('00000000-0000-0000-0000-000000000011', 'L3', 'Engineering', 'VP Project Management',      'Unit Project Management',      '00000000-0000-0000-0000-000000000002'),
        ('00000000-0000-0000-0000-000000000012', 'L3', 'Engineering', 'VP Quality Assurance',       'Unit Quality Assurance',       '00000000-0000-0000-0000-000000000002')
      ON CONFLICT DO NOTHING
    `
        console.log('   ✅ L3 Engineering: Maintenance & Utility, Project Management, Quality Assurance')

        // L3: Units — Finance
        await sql`
      INSERT INTO departments (id, level, name, head_position, unit_name, parent_id) VALUES
        ('00000000-0000-0000-0000-000000000020', 'L3', 'Finance', 'VP Procurement',           'Unit Procurement',           '00000000-0000-0000-0000-000000000003'),
        ('00000000-0000-0000-0000-000000000021', 'L3', 'Finance', 'VP Tax & Accounting',      'Unit Tax & Accounting',      '00000000-0000-0000-0000-000000000003'),
        ('00000000-0000-0000-0000-000000000022', 'L3', 'Finance', 'VP Treasury & Cash Flow',  'Unit Treasury & Cash Flow',  '00000000-0000-0000-0000-000000000003')
      ON CONFLICT DO NOTHING
    `
        console.log('   ✅ L3 Finance: Procurement, Tax & Accounting, Treasury & Cash Flow')

        // L3: Units — Human Resource
        await sql`
      INSERT INTO departments (id, level, name, head_position, unit_name, parent_id) VALUES
        ('00000000-0000-0000-0000-000000000030', 'L3', 'Human Resource', 'VP Learning & Development', 'Unit Learning & Development', '00000000-0000-0000-0000-000000000004'),
        ('00000000-0000-0000-0000-000000000031', 'L3', 'Human Resource', 'VP Payroll & Benefit',      'Unit Payroll & Benefit',      '00000000-0000-0000-0000-000000000004'),
        ('00000000-0000-0000-0000-000000000032', 'L3', 'Human Resource', 'VP Recruitment',            'Unit Recruitment',            '00000000-0000-0000-0000-000000000004')
      ON CONFLICT DO NOTHING
    `
        console.log('   ✅ L3 Human Resource: Learning & Development, Payroll & Benefit, Recruitment')

        // L3: Units — IT
        await sql`
      INSERT INTO departments (id, level, name, head_position, unit_name, parent_id) VALUES
        ('00000000-0000-0000-0000-000000000040', 'L3', 'IT', 'VP Infrastructure & Security', 'Unit Infrastructure & Security', '00000000-0000-0000-0000-000000000005'),
        ('00000000-0000-0000-0000-000000000042', 'L3', 'IT', 'VP Software Development',      'Unit Software Development',      '00000000-0000-0000-0000-000000000005'),
        ('00000000-0000-0000-0000-000000000043', 'L3', 'IT', 'VP Support & Helpdesk',        'Unit Support & Helpdesk',        '00000000-0000-0000-0000-000000000005')
      ON CONFLICT DO NOTHING
    `
        console.log('   ✅ L3 IT: Infrastructure & Security, Software Development, Support & Helpdesk')

        // ─── 3. KPI DICTIONARY ──────────────────────────────────────
        console.log('\n📖 Insert KPI dictionary...')
        await sql`
      INSERT INTO kpi_dictionary (action_verb, definition, data_source) VALUES
        ('Infrastructure Availability',  'Ketersediaan jaringan utama dan kesiapan infrastruktur pemulihan bencana.', 'Network Monitoring (NMS)'),
        ('Fleet Technical Reliability',  'Keandalan teknis armada untuk mencegah gangguan jadwal penerbangan.',       'AMOS (Maintenance System)'),
        ('Tax Compliance Rate',          'Tingkat kepatuhan pajak global tanpa denda administratif.',                 'Database Perpajakan'),
        ('Digital Sales Progress',       'Persentase penyelesaian fitur penjualan tiket dan integrasi NDC.',          'Project Management Tool'),
        ('Financial Closing Cycle',      'Ketepatan waktu penyelesaian laporan keuangan bulanan.',                   'Log SAP Financial'),
        ('Talent Acquisition Velocity',  'Kecepatan pengisian posisi operasional kritis (Pilot/Teknisi).',            'SAP HCM / ATS'),
        ('Cybersecurity Maturity',       'Tingkat pertahanan siber dan efektivitas kontrol risiko data.',             'Audit Keamanan Siber'),
        ('Asset Integrity Index',        'Akurasi dokumen suku cadang dan kelaikan alat pendukung teknis.',           'Inventori Teknik'),
        ('OpEx Variance Control',        'Pengendalian pengeluaran operasional agar sesuai dengan pagu anggaran.',    'Budget Monitoring Report'),
        ('Safety Training Index',        'Rasio penyelesaian pelatihan keselamatan wajib bagi personil.',            'LMS (Learning System)')
      ON CONFLICT DO NOTHING
    `
        console.log('   ✅ 10 KPI dictionary entries')

        // ─── SUMMARY ────────────────────────────────────────────────
        const [userCount] = await sql`SELECT COUNT(*) FROM users`
        const [deptCount] = await sql`SELECT COUNT(*) FROM departments`
        const [dictCount] = await sql`SELECT COUNT(*) FROM kpi_dictionary`

        console.log('\n✅ Seed selesai!')
        console.log(`   Users      : ${userCount.count}`)
        console.log(`   Departments: ${deptCount.count}`)
        console.log(`   KPI Dict   : ${dictCount.count}`)
        console.log('\n⚠️  PENTING: Ganti password admin setelah login pertama!')
        console.log('   Login: admin@company.com / admin123')
        console.log('\n👉 Jalankan berikutnya: npm run dev')

    } catch (err) {
        console.error('\n❌ Seed gagal:', err.message)
        console.error(err)
        process.exit(1)
    } finally {
        await sql.end()
    }
}

seed()