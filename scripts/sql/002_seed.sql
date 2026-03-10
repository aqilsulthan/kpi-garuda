-- =============================================================
-- KPI Management System — Seed Data
-- Data dari Dictionary.xlsx (hirarki_PTX + KPI Dictionary)
-- Jalankan SETELAH 001_init.sql
-- =============================================================

-- ─── 1. ADMIN USER ────────────────────────────────────────────
INSERT INTO users (name, email, password_hash, role)
VALUES (
  'System Admin',
  'admin@company.com',
  '$2a$12$kP5aZszJvqVTtyjeQBc0getdQ9n7fTNP2QA5MPP0c9W3qV5Ml0hzGy',
  'admin'
)
ON CONFLICT (email) DO NOTHING;

-- ─── 2. DEPARTMENTS (dari hirarki_PTX) ────────────────────────
-- L1: Corporate
INSERT INTO departments (id, level, name, head_position, unit_name, parent_id) VALUES
  ('00000000-0000-0000-0000-000000000001', 'L1', 'Corporate', 'Chief Executive Officer (CEO)', NULL, NULL)
ON CONFLICT DO NOTHING;

-- L2: Directors
INSERT INTO departments (id, level, name, head_position, unit_name, parent_id) VALUES
  ('00000000-0000-0000-0000-000000000002', 'L2', 'Engineering',    'Director of Engineering',        NULL, '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000003', 'L2', 'Finance',        'Director of Finance',            NULL, '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000004', 'L2', 'Human Resource', 'Director of Human Resource',     NULL, '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000005', 'L2', 'IT',             'Chief Information Officer (CIO)', NULL, '00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- L3: VP / Units — Engineering
INSERT INTO departments (id, level, name, head_position, unit_name, parent_id) VALUES
  ('00000000-0000-0000-0000-000000000010', 'L3', 'Engineering', 'VP Maintenance & Utility',   'Unit Maintenance & Utility',   '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000011', 'L3', 'Engineering', 'VP Project Management',      'Unit Project Management',      '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000012', 'L3', 'Engineering', 'VP Quality Assurance',       'Unit Quality Assurance',       '00000000-0000-0000-0000-000000000002')
ON CONFLICT DO NOTHING;

-- L3: VP / Units — Finance
INSERT INTO departments (id, level, name, head_position, unit_name, parent_id) VALUES
  ('00000000-0000-0000-0000-000000000020', 'L3', 'Finance', 'VP Procurement',           'Unit Procurement',           '00000000-0000-0000-0000-000000000003'),
  ('00000000-0000-0000-0000-000000000021', 'L3', 'Finance', 'VP Tax & Accounting',      'Unit Tax & Accounting',      '00000000-0000-0000-0000-000000000003'),
  ('00000000-0000-0000-0000-000000000022', 'L3', 'Finance', 'VP Treasury & Cash Flow',  'Unit Treasury & Cash Flow',  '00000000-0000-0000-0000-000000000003')
ON CONFLICT DO NOTHING;

-- L3: VP / Units — Human Resource
INSERT INTO departments (id, level, name, head_position, unit_name, parent_id) VALUES
  ('00000000-0000-0000-0000-000000000030', 'L3', 'Human Resource', 'VP Learning & Development', 'Unit Learning & Development', '00000000-0000-0000-0000-000000000004'),
  ('00000000-0000-0000-0000-000000000031', 'L3', 'Human Resource', 'VP Payroll & Benefit',      'Unit Payroll & Benefit',      '00000000-0000-0000-0000-000000000004'),
  ('00000000-0000-0000-0000-000000000032', 'L3', 'Human Resource', 'VP Recruitment',            'Unit Recruitment',            '00000000-0000-0000-0000-000000000004')
ON CONFLICT DO NOTHING;

-- L3: VP / Units — IT
INSERT INTO departments (id, level, name, head_position, unit_name, parent_id) VALUES
  ('00000000-0000-0000-0000-000000000040', 'L3', 'IT', 'VP Infrastructure & Security', 'Unit Infrastructure & Security', '00000000-0000-0000-0000-000000000005'),
  ('00000000-0000-0000-0000-000000000042', 'L3', 'IT', 'VP Software Development',      'Unit Software Development',      '00000000-0000-0000-0000-000000000005'),
  ('00000000-0000-0000-0000-000000000043', 'L3', 'IT', 'VP Support & Helpdesk',        'Unit Support & Helpdesk',        '00000000-0000-0000-0000-000000000005')
ON CONFLICT DO NOTHING;

-- ─── 3. KPI DICTIONARY ───────────────────────────────────────
INSERT INTO kpi_dictionary (action_verb, definition, data_source) VALUES
  ('Infrastructure Availability',  'Ketersediaan jaringan utama dan kesiapan infrastruktur pemulihan bencana.',  'Network Monitoring (NMS)'),
  ('Fleet Technical Reliability',  'Keandalan teknis armada untuk mencegah gangguan jadwal penerbangan.',       'AMOS (Maintenance System)'),
  ('Tax Compliance Rate',          'Tingkat kepatuhan pajak global tanpa denda administratif.',                 'Database Perpajakan'),
  ('Digital Sales Progress',       'Persentase penyelesaian fitur penjualan tiket dan integrasi NDC.',          'Project Management Tool'),
  ('Financial Closing Cycle',      'Ketepatan waktu penyelesaian laporan keuangan bulanan.',                   'Log SAP Financial'),
  ('Talent Acquisition Velocity',  'Kecepatan pengisian posisi operasional kritis (Pilot/Teknisi).',            'SAP HCM / ATS'),
  ('Cybersecurity Maturity',       'Tingkat pertahanan siber dan efektivitas kontrol risiko data.',             'Audit Keamanan Siber'),
  ('Asset Integrity Index',        'Akurasi dokumen suku cadang dan kelaikan alat pendukung teknis.',           'Inventori Teknik'),
  ('OpEx Variance Control',        'Pengendalian pengeluaran operasional agar sesuai dengan pagu anggaran.',    'Budget Monitoring Report'),
  ('Safety Training Index',        'Rasio penyelesaian pelatihan keselamatan wajib bagi personil.',            'LMS (Learning System)')
ON CONFLICT DO NOTHING;

SELECT 'Seed selesai. Admin user, Departments, dan KPI Dictionary berhasil diisi.' AS status;
