# KPI Management System
**Next.js + NextAuth + PostgreSQL + Dify Enterprise (Qwen)**

Sistem manajemen KPI berbasis AI yang membantu tim Corporate Planning menghasilkan insight dan rekomendasi otomatis kepada Direksi — menggantikan proses analisis manual yang memakan beberapa hari kerja.

---

## Arsitektur

```
┌─────────────────────────────────────────────────────┐
│                  NEXT.JS (App Router)               │
│  /admin/upload   /planning/[period]   /board/[period]│
│         ↕ API Routes (6 endpoints)                  │
└──────────────────┬──────────────────────────────────┘
                   │
       ┌───────────┴────────────┐
       ▼                        ▼
┌─────────────┐      ┌──────────────────────┐
│  PostgreSQL │      │   Dify Enterprise    │
│  Perusahaan │      │  kpi-analyst (WF)    │
│  6 tabel    │      │  kpi-assistant (CF)  │
│             │      │  KB: kpi-context     │
└─────────────┘      └──────────────────────┘
                              │ Qwen LLM (full access)
```

---

## Stack

| Layer | Teknologi | Keterangan |
|---|---|---|
| Frontend + Backend | Next.js 14 (App Router) | UI + API Routes |
| Auth | NextAuth.js v5 | Session JWT, role-based |
| Database | PostgreSQL Perusahaan | Aliyun RDS |
| AI Platform | Dify Enterprise 1.11.8 | Self-hosted |
| LLM | Qwen | Full access, sudah disediakan |
| Excel Parser | SheetJS (xlsx) | Parse di browser |
| Styling | Tailwind CSS | |

---

## Role & Akses

| Role | Akses |
|---|---|
| `admin` | Upload Excel, kelola user, input data eksternal |
| `corporate_planning` | Dashboard scorecard, trigger AI, kirim laporan ke BOD |
| `direksi` | Baca laporan published, chat AI |

---

## Struktur Folder

```
kpi-system/
├── app/
│   ├── login/                    # Halaman login
│   ├── admin/upload/             # Upload Excel + data eksternal
│   ├── planning/
│   │   ├── page.tsx              # List periode
│   │   └── [period]/             # Workspace Corporate Planning
│   ├── board/
│   │   ├── page.tsx              # List laporan BOD
│   │   └── [period]/             # Laporan Direksi
│   └── api/
│       ├── auth/[...nextauth]/   # NextAuth handler
│       ├── kpi/                  # GET scorecard
│       ├── analysis/             # POST/GET analysis_drafts
│       ├── dify/                 # Proxy Dify Workflow & Chat
│       ├── parse-excel/          # Insert hasil parse ke DB
│       └── external-data/
│           ├── route.ts          # GET/POST data eksternal
│           └── fetch/            # Auto-fetch dari API resmi
├── components/
│   └── layout/AppShell.tsx       # Sidebar + layout utama
├── lib/
│   ├── auth.ts                   # NextAuth config
│   ├── db.ts                     # Koneksi PostgreSQL
│   ├── calc.ts                   # Kalkulasi KPI on-the-fly
│   ├── dify.ts                   # Dify API wrapper
│   └── parser.ts                 # SheetJS Excel parser
├── scripts/sql/
│   ├── 001_init.sql              # Buat semua tabel
│   └── 002_seed.sql              # Seed departments + KPI dictionary
├── types/index.ts                # TypeScript types
├── middleware.ts                 # Route protection by role
└── .env.example                  # Template environment variables
```

---

## Cara Install & Jalankan

### Prasyarat
- Node.js 18+
- Akses ke PostgreSQL perusahaan
- Dify Enterprise 1.11.8 sudah running
- npm atau yarn

### 1. Clone & Install Dependencies

```bash
git clone <repo-url> kpi-system
cd kpi-system
npm install
```

### 2. Setup Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` dengan nilai sebenarnya:

```env
# PostgreSQL Perusahaan
PGHOST=xx-xxxxxxxxxx.gpdbmaster.ap-southeast-5.rds.aliyuncs.com
PGPORT=5432
PGDATABASE=dxxxxxxxxx
PGUSER=dxxxx
PGPASSWORD=xxxxxxxxxxxxxxxxxx

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate dengan: openssl rand -base64 32>

# Dify Enterprise
DIFY_BASE_URL=https://your-dify.company.com
DIFY_WORKFLOW_API_KEY=app-xxxxxxxxxxxxxxxxxxxx
DIFY_CHATFLOW_API_KEY=app-xxxxxxxxxxxxxxxxxxxx

# External Data APIs (opsional, bisa diisi manual jika tidak ada)
EIA_API_KEY=your-eia-api-key
BPS_API_KEY=your-bps-api-key
```

### 3. Setup Database

Jalankan SQL di PostgreSQL perusahaan (urut):

```bash
# Via psql:
psql -h $PGHOST -U $PGUSER -d $PGDATABASE -f scripts/sql/001_init.sql
psql -h $PGHOST -U $PGUSER -d $PGDATABASE -f scripts/sql/002_seed.sql
```

Atau copy-paste isi file SQL ke tool database yang dipakai (DBeaver, pgAdmin, dsb).

Setelah selesai, sistem akan otomatis membuat:
- 8 tabel (users, departments, kpi_dictionary, kpi_items, kpi_actuals, analysis_drafts, external_data, upload_logs)
- 1 akun admin default: `admin@company.com` / `admin123`
- Data departments dari hirarki PTX (sesuai Dictionary.xlsx)
- KPI Dictionary dari Dictionary.xlsx

> ⚠️ **Ganti password admin segera setelah login pertama!**

### 4. Setup Dify Enterprise

#### App 1: kpi-analyst (Workflow)

1. Buka Dify Enterprise → **Studio → Create App → Workflow**
2. Beri nama: `kpi-analyst`
3. Buat node berikut:

```
[Start]
  Input variables:
  - action (string): "analyze" | "summarize" | "suggest"
  - dept_name (string)
  - period (string): format YYYY-MM
  - kpi_data (string): JSON array KPI items
  - external_data (string): JSON array data eksternal

[Knowledge Retrieval]
  Knowledge Base: kpi-context
  Query: "{{dept_name}} {{period}} KPI analisis konteks"
  Top K: 5

[IF Node — branch by action]
  Condition: {{action}} == "analyze"
  → True: LLM Node (analyze prompt)
  → False: IF action == "summarize" → LLM Node (summarize) / LLM Node (suggest)

[LLM Node — Qwen]
  System Prompt (sesuaikan per action):

  === ANALYZE ===
  Kamu adalah KPI analyst senior maskapai penerbangan.
  Analisis data KPI berikut dan identifikasi:
  1. KPI yang underperform (ach_rate < 90%)
  2. Root cause analysis berdasarkan key drivers
  3. Dampak terhadap pilar strategis perusahaan
  4. Konteks data eksternal yang relevan
  Gunakan bahasa Indonesia formal. Jawab komprehensif.
  
  Konteks kebijakan: {{knowledge}}
  Data KPI: {{kpi_data}}
  Data Eksternal: {{external_data}}
  Departemen: {{dept_name}} | Periode: {{period}}

  === SUMMARIZE ===
  Buat executive summary ringkas (maks 300 kata) dari data KPI berikut untuk Direksi.
  Highlight: total score, KPI kritis, dan 3 rekomendasi utama.
  [lanjutkan dengan data...]

  === SUGGEST ===
  Berikan rekomendasi improvement yang spesifik dan actionable untuk setiap KPI
  dengan ach_rate < 90%. Format: KPI → Rekomendasi → Target perbaikan → Penanggung jawab.
  [lanjutkan dengan data...]

[End]
  Output: result (text dari LLM)
```

4. Publish app → copy **API Key** → masukkan ke `.env.local` sebagai `DIFY_WORKFLOW_API_KEY`

#### App 2: kpi-assistant (Chatflow)

1. Buka Dify Enterprise → **Studio → Create App → Chatflow**
2. Beri nama: `kpi-assistant`
3. System Prompt:

```
Kamu adalah KPI Management Assistant untuk perusahaan maskapai penerbangan.

Role pengguna: {{role}}
Konteks data: {{context}}

Jika role = "corporate_planning":
- Bantu menganalisis, memperkaya, dan menyempurnakan draft laporan KPI
- Berikan insight tambahan berdasarkan data eksternal dan konteks industri
- Gunakan bahasa Indonesia formal dan teknis

Jika role = "direksi":
- Jawab pertanyaan secara ringkas dan actionable
- Fokus pada dampak bisnis dan rekomendasi strategis
- Hindari detail teknis yang tidak perlu

Selalu referensikan data aktual dari konteks yang diberikan.
```

4. Publish app → copy **API Key** → masukkan ke `.env.local` sebagai `DIFY_CHATFLOW_API_KEY`

#### Knowledge Base: kpi-context

1. Buka Dify Enterprise → **Knowledge → Create Knowledge**
2. Beri nama: `kpi-context`
3. Upload dokumen awal:
   - Kebijakan KPI perusahaan (PDF/DOCX)
   - Dictionary.xlsx (sheet KPI Dictionary)
   - Definisi grade: Hijau ≥ 90%, Kuning 75–89%, Merah < 75%
4. Pastikan Knowledge Base ini terhubung ke kedua App di atas

### 5. Tambah User

```bash
# Via API (setelah server running):
curl -X POST http://localhost:3000/api/admin/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Budi Santoso","email":"budi@company.com","password":"password123","role":"corporate_planning"}'
```

Atau tambah langsung via SQL:

```sql
-- Generate hash dulu: bcrypt.hash('password123', 12)
INSERT INTO users (name, email, password_hash, role) VALUES
  ('Budi Santoso', 'budi@company.com', '$2a$12$...hash...', 'corporate_planning'),
  ('Direktur Utama', 'dirut@company.com', '$2a$12$...hash...', 'direksi');
```

### 6. Jalankan Server

```bash
# Development
npm run dev
# → http://localhost:3000

# Production build
npm run build
npm start
```

---

## Panduan Penggunaan per Role

### 👤 Admin

#### Upload KPI Excel Bulanan

1. Login → otomatis redirect ke `/admin/upload`
2. **Bagian 1 — Upload Excel:**
   - Pilih **Level KPI**: Corporate (L1) / Department (L2) / Unit (L3)
   - Pilih **Departemen** dari dropdown (terisi dari DB)
   - Pilih **Periode** (format YYYY-MM, contoh: 2025-03)
   - Drag & drop file `.xlsx` atau klik untuk pilih
   - Sistem akan otomatis parse dan tampilkan **preview tabel**
   - Cek validasi: total bobot harus 100%, tidak ada field kosong
   - Klik **Confirm & Simpan**

3. **Bagian 2 — Data Eksternal:**
   - Pilih periode
   - Klik **🔄 Auto-fetch dari API** → kurs USD/IDR, crude oil, inflasi terisi otomatis
   - Isi manual: **Harga Avtur** (IDR/liter) dan **Market Share** (%)
   - Klik **Simpan Data Eksternal**

4. **Bagian 3 — Update Knowledge Base Dify:**
   - Klik link **Buka Dify Enterprise → Knowledge Base**
   - Upload dokumen terbaru (laporan riset, data industri, dll)

#### Format Excel yang Diterima

File harus menggunakan **template resmi** dengan sheet bernama `KPI` (huruf kapital).

| Level | Kolom Wajib |
|---|---|
| Corporate (L1) | No, Objective Sentence, Action Verb/KPI, From, To, Parameters, Bobot (%), Key Driver, Polaritas, Remarks |
| Department (L2) | + Cascaded from Direksi |
| Unit (L3) | + Cascaded from Dept. X (boleh multi-baris per KPI) |

> ℹ️ Kolom `Departemen` dan `Unit` di file Excel diabaikan — diambil dari pilihan dropdown UI.

---

### 📊 Corporate Planning

1. Login → otomatis redirect ke `/planning`
2. Pilih **periode aktif** atau klik tombol periode terbaru

#### Di halaman `/planning/[period]`:

**Panel Kiri — Scorecard:**
- Lihat daftar semua dept/unit dengan warna grade:
  - 🟢 ≥ 90% | 🟡 75–89% | 🔴 < 75%
- Klik departemen untuk buka workspace-nya
- Data eksternal (kurs, avtur, dll) ditampilkan di bagian bawah

**Panel Kanan — AI Workspace:**
- Pilih departemen dari panel kiri
- Lihat tabel KPI lengkap dengan ach_rate dan score
- Klik salah satu tombol:
  - **🔍 Analyze** → AI analisis mendalam KPI underperform + konteks eksternal
  - **📋 Summarize** → AI buat executive summary ringkas untuk BOD
  - **💡 Suggest** → AI buat rekomendasi improvement actionable
- Draft analisis muncul di textarea → **bisa diedit langsung**
- Gunakan **Chat AI** di bagian bawah untuk perkaya konten:
  - `"Tambahkan dampak kenaikan avtur ke bagian KPI Cost"`
  - `"Buat rekomendasi untuk KPI Infrastructure lebih spesifik"`
- Klik **✅ Kirim ke BOD →** → laporan dikirim ke Direksi

---

### 🏢 Direksi / BOD

1. Login → otomatis redirect ke `/board`
2. Pilih periode laporan yang tersedia

#### Di halaman `/board/[period]`:

**Panel Kiri:**
- Daftar laporan yang sudah dikirim Corporate Planning
- Pilih laporan departemen/unit yang ingin dibaca

**Panel Utama:**
- Baca konten laporan analisis lengkap
- Informasi: periode, tanggal dikirim, dept terkait

**Chat AI:**
- Tanya langsung ke AI tentang laporan yang sedang dibaca:
  - `"Apa 3 risiko utama bulan ini?"`
  - `"Kenapa KPI Infrastructure turun? Apa rekomendasinya?"`
  - `"Bandingkan performa dept IT vs HR bulan ini"`

---

## Kalkulasi KPI

Semua kalkulasi dilakukan **on-the-fly** dari database, tidak ada angka yang di-cache:

```
Polaritas MAX  → ach_rate = actual / target
Polaritas MIN  → ach_rate = target / actual   (lebih kecil = lebih baik)
Score          → score    = ach_rate × bobot
Total Score    → SUMPRODUCT(score[])

Grade:
  🟢 ≥ 90%  (total_score ≥ 0.9)
  🟡 75–89% (total_score ≥ 0.75)
  🔴 < 75%  (total_score < 0.75)
```

Contoh KPI Polaritas MIN (HR — Time-to-Fill):
```
Target: 45 hari | Aktual: 42 hari | Bobot: 15%
ach_rate = 45 / 42 = 1.071 (melebihi target, bagus)
score    = 1.071 × 0.15 = 0.1607 (16.07%)
```

---

## Troubleshooting

| Masalah | Kemungkinan Penyebab | Solusi |
|---|---|---|
| Login gagal | Password salah / user tidak aktif | Cek tabel `users`, pastikan `is_active = true` |
| Upload Excel error "Sheet KPI tidak ditemukan" | Nama sheet berbeda | Rename sheet menjadi `KPI` (huruf kapital) |
| Upload Excel error "Total bobot ≠ 100%" | Bobot tidak pas 100 | Periksa kolom Bobot, pastikan jumlah = 100% |
| Dify gagal generate | API key salah / Dify tidak running | Cek `DIFY_BASE_URL` dan API key di `.env.local` |
| Auto-fetch kurs gagal | Tidak ada internet / Frankfurter down | Isi manual di form data eksternal |
| Scorecard tidak muncul | Belum ada kpi_items untuk periode ini | Admin upload Excel terlebih dahulu |
| "Belum lengkap" di scorecard | Ada KPI item yang belum punya actual_value | Tambah data aktual via upload atau UI |

---

## Development Notes

### Menambah Departemen Baru

```sql
INSERT INTO departments (level, name, head_position, unit_name, parent_id)
VALUES ('L2', 'Operations', 'Director of Operations', NULL, '00000000-0000-0000-0000-000000000001');
```

### Mengganti Password User

```sql
-- Hash password baru dulu dengan bcrypt (12 rounds)
UPDATE users SET password_hash = '$2a$12$...' WHERE email = 'user@company.com';
```

### Memahami Struktur Periode

Format periode: `YYYY-MM` (contoh: `2025-03` untuk Maret 2025)

Satu file Excel = satu dept + satu periode. Jika upload ulang dept + periode yang sama, data lama akan **ditimpa**.

---

## Lisensi

Internal use only — PT X (Perusahaan).
