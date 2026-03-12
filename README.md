# KPI Management System
**Next.js 14 · NextAuth v5 · PostgreSQL · Dify Enterprise (Qwen LLM)**

Sistem manajemen KPI berbasis AI yang membantu tim Corporate Planning menghasilkan laporan analisis otomatis dan menyampaikannya kepada Direksi — menggantikan proses analisis Excel manual yang memakan beberapa hari kerja.

---

## Arsitektur Sistem

```
┌───────────────────────────────────────────────────────────────────┐
│                        NEXT.JS (App Router)                       │
│  /admin  /planning/[period]  /board/[period]  /chat               │
│                    ↕ API Routes                                   │
│  /api/kpis  /api/analytics  /api/integrations/dify                │
│  /api/users  /api/chats  /api/agent/*                             │
└────────────────────────────────┬──────────────────────────────────┘
                                 │
              ┌──────────────────┴──────────────────┐
              ▼                                      ▼
   ┌────────────────────┐              ┌─────────────────────────┐
   │   PostgreSQL       │              │   Dify Enterprise       │
   │   (Supabase)       │              │   ─────────────────     │
   │   ─────────────    │              │   kpi-analyst  (WF)     │
   │   users            │              │   kpi-assistant (CF)    │
   │   departments      │              │   bod-agent    (Agent)  │
   │   kpi_items        │◄────────────►│                         │
   │   kpi_actuals      │  context     │   Tool Calling:         │
   │   analysis_drafts  │  injection   │   /api/agent/           │
   │   external_data    │              │   get-kpi-trend         │
   │   chat_messages    │              └─────────────────────────┘
   └────────────────────┘                        │
                                           Qwen LLM
```

---

## Technology Stack

| Layer | Teknologi | Keterangan |
|---|---|---|
| Frontend + Backend | Next.js 14 (App Router) | SSR + API Routes |
| Autentikasi | NextAuth.js v5 | Session JWT, role-based routing |
| Database | PostgreSQL (Supabase) | 7+ tabel, real-time calc |
| AI Platform | Dify Enterprise 1.11.8 (self-hosted) | Workflow + Chatflow + Agent |
| LLM | Qwen | Bahasa Indonesia, analytical |
| Excel Parser | SheetJS (xlsx) | Parse di server-side |
| Styling | Tailwind CSS + @tailwindcss/typography | Markdown rendering |
| Markdown Chat | react-markdown | Render bold, heading, list di chat |
| Charts | Recharts | Trend lines per KPI |
| Validation | Zod | Schema validation |
| Icons | lucide-react | UI icons |

---

## Role & Hak Akses

| Role | Halaman yang Dapat Diakses | Kemampuan |
|---|---|---|
| `admin` | `/admin/*` | Upload Excel, kelola user, input & auto-fetch data eksternal |
| `corporate_planning` | `/planning/*` | Dashboard scorecard, generate AI, publish laporan ke BOD |
| `direksi` | `/board/*`, `/chat` | Baca laporan published, Executive Copilot AI |

---

## Struktur Folder

```
kpi-system/
├── app/
│   ├── login/                          # Autentikasi
│   ├── chat/                           # Executive Copilot (khusus direksi)
│   │   ├── page.tsx
│   │   └── ChatClient.tsx              # UI chat dengan history & markdown render
│   ├── admin/
│   │   ├── page.tsx                    # Redirect ke /admin/upload
│   │   ├── upload/                     # Upload Excel + Data Eksternal
│   │   │   ├── page.tsx
│   │   │   ├── UploadExcelForm.tsx
│   │   │   └── ExternalDataForm.tsx
│   │   ├── kpi-list/                   # List & hapus data KPI per periode
│   │   └── users/                      # Kelola akun user
│   ├── planning/
│   │   ├── page.tsx                    # List semua periode
│   │   └── [period]/
│   │       ├── page.tsx
│   │       └── PlanningWorkspace.tsx   # AI Workspace + Copilot Chat
│   ├── board/
│   │   ├── page.tsx                    # List periode laporan
│   │   └── [period]/
│   │       ├── page.tsx
│   │       └── BoardReport.tsx         # Laporan + Executive Assistant AI
│   └── api/
│       ├── auth/[...nextauth]/         # NextAuth handler
│       ├── kpis/
│       │   ├── route.ts                # GET scorecard per dept/period
│       │   ├── import/route.ts         # POST import KPI dari Excel
│       │   └── periods/route.ts        # GET list periode, DELETE KPI periode
│       ├── analytics/route.ts          # GET/POST analysis drafts
│       ├── integrations/
│       │   ├── dify/route.ts           # Proxy Dify (workflow + chat) + context injection
│       │   └── external-data/
│       │       ├── route.ts            # GET/POST/DELETE data eksternal
│       │       └── fetch/route.ts      # Auto-fetch kurs, oil, inflasi
│       ├── chats/history/route.ts      # GET riwayat chat dari DB
│       ├── users/route.ts              # GET/POST/DELETE user (admin)
│       ├── system/migrate/route.ts     # DB migration utility
│       └── agent/                      # Endpoint khusus Dify Tool Calling
│           └── get-kpi-trend/route.ts  # GET tren historis KPI per dept (auth via DIFY_AGENT_SECRET)
├── components/
│   ├── layout/AppShell.tsx             # Sidebar + layout utama + dark mode
│   ├── ui/                             # Button, Card, Badge, Input, dll
│   ├── features/
│   │   ├── AdminDashboardCharts.tsx
│   │   ├── BODDashboardCharts.tsx
│   │   ├── DeptDashboardCharts.tsx
│   │   └── DeleteKpiForm.tsx
│   └── kpi/MacroEconomicsWidget.tsx    # Widget data makro ekonomi
├── lib/
│   ├── auth.ts                         # NextAuth config (JWT + DB session)
│   ├── db.ts                           # Koneksi PostgreSQL (postgres package)
│   ├── calc.ts                         # getDeptScorecard, getAllScorecards, kalkulasi on-the-fly
│   ├── dify.ts                         # runKpiAnalyst(), sendChatMessage()
│   ├── external.ts                     # gatherExternalMacroData(), DATA_PROVIDERS
│   └── parser.ts                       # SheetJS Excel parser
├── dify/
│   ├── kpi-analyst.yml                 # Dify Workflow config (exportable)
│   ├── kpi-assistant.yml               # Dify Chatflow config
│   └── stable/v3/
│       └── v3-web-kpi-assistant.yml    # Versi stabil terbaru
├── scripts/sql/
│   ├── 001_init.sql                    # DDL tabel + enum + index
│   └── 002_seed.sql                    # Seed departments + KPI dictionary
├── types/index.ts                      # TypeScript types global
├── middleware.ts                       # Route protection by role (bypass /api/agent)
└── .env.local                          # Environment variables (tidak di-commit)
```

---

## Setup & Instalasi

### Prasyarat
- Node.js 18+
- PostgreSQL (Supabase, Neon, atau self-hosted)
- Dify Enterprise sudah running & dikonfigurasi
- npm

### 1. Clone & Install

```bash
git clone <repo-url> kpi-system
cd kpi-system
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env.local
```

Isi `.env.local`:

```env
# PostgreSQL
PGHOST=<host>
PGPORT=5432
PGDATABASE=postgres
PGUSER=<user>
PGPASSWORD=<password>

# NextAuth
NEXTAUTH_URL=http://localhost:3000
AUTH_URL=http://localhost:3000
AUTH_TRUST_HOST=true
NEXTAUTH_SECRET=<openssl rand -base64 32>

# Dify Enterprise
DIFY_BASE_URL=http://dify-api.your-domain.com/v1
DIFY_WORKFLOW_API_KEY=app-xxxxxxxxxx
DIFY_CHATFLOW_API_KEY=app-xxxxxxxxxx
DIFY_EXECUTIVE_AGENT_API_KEY=app-xxxxxxxxxx

# Agent Tool Calling Secret (dibuat sendiri, dimasukkan ke Dify Custom Tool)
DIFY_AGENT_SECRET=rahasia-agent-xxx

# External Data APIs
FRANKFURTER_URL=https://api.frankfurter.app
EIA_API_KEY=<daftar di eia.gov>
BPS_API_KEY=<daftar di webapi.bps.go.id>
```

### 3. Setup Database

```bash
# Via psql:
psql -h $PGHOST -U $PGUSER -d $PGDATABASE -f scripts/sql/001_init.sql
psql -h $PGHOST -U $PGUSER -d $PGDATABASE -f scripts/sql/002_seed.sql
```

Atau copy-paste isi `.sql` ke DBeaver / pgAdmin / Supabase SQL Editor.

### 4. Jalankan Server

```bash
npm run dev
# → http://localhost:3000
```

---

## API Endpoints

### Internal (Dilindungi NextAuth Session)

| Method | Endpoint | Fungsi |
|---|---|---|
| `GET` | `/api/kpis?period=&dept_id=` | Ambil scorecard per dept atau semua dept |
| `POST` | `/api/kpis/import` | Import data KPI dari Excel ke DB |
| `GET/DELETE` | `/api/kpis/periods` | List atau hapus data per periode |
| `GET/POST` | `/api/analytics` | Ambil / simpan draft analisis AI |
| `POST` | `/api/integrations/dify` | Proxy ke Dify (workflow & chat) |
| `GET/POST/DELETE` | `/api/integrations/external-data` | Kelola data makro ekonomi |
| `GET` | `/api/integrations/external-data/fetch` | Auto-fetch data dari API eksternal |
| `GET` | `/api/chats/history` | Riwayat chat user yang sedang login |
| `GET/POST/DELETE` | `/api/users` | Manajemen user (admin only) |

### Agent / Tool Calling (Dilindungi `DIFY_AGENT_SECRET`)

| Method | Endpoint | Parameter | Fungsi |
|---|---|---|---|
| `GET` | `/api/agent/get-kpi-trend` | `dept_name`, `months` | Tren historis KPI 1-36 bulan |

---

## Kalkulasi KPI (On-the-fly)

Semua kalkulasi dilakukan langsung dari database saat request. Tidak ada angka yang di-cache atau di-pre-compute.

```
Polaritas MAX  → ach_rate = actual / target_to
Polaritas MIN  → ach_rate = target_to / actual   (lebih kecil = lebih baik)
Score per KPI  → score    = ach_rate × bobot
Total Score    → Σ(score[]) untuk semua KPI items

Grade:
  🟢 Green  ≥ 90%  (total_score ≥ 0.90)
  🟡 Yellow 75–89% (total_score ≥ 0.75)
  🔴 Red    < 75%  (total_score < 0.75)
```

---

## Dify AI Architecture

### 3 AI Apps yang Dikonfigurasi:

| App | Type | Key | Digunakan untuk |
|---|---|---|---|
| `kpi-analyst` | Workflow | `DIFY_WORKFLOW_API_KEY` | Generate analisis, ringkasan, saran di Planning |
| `kpi-assistant` | Chatflow | `DIFY_CHATFLOW_API_KEY` | Copilot chat Corporate Planning |
| `bod-agent` | Agent | `DIFY_EXECUTIVE_AGENT_API_KEY` | Executive Copilot BOD (streaming + Tool Calling) |

### Context Injection (General Chat BOD)

Setiap kali BOD membuka `/chat`, server otomatis menyuntikkan ke dalam prompt:
- **KPI L1 Corporate** lengkap dengan detail semua KPI items
- **KPI L2 (Departemen) & L3 (Unit)** — semua entitas dengan skor & detail KPI
- **Data Makro Ekonomi** — kurs USD/IDR, crude oil, inflasi, avtur, market share

Ini memungkinkan AI menjawab pertanyaan tentang **departemen atau unit manapun** tanpa harus memanggil API tambahan.

### Tool Calling (Drill-down Historis)

Endpoint `/api/agent/get-kpi-trend` terhubung sebagai **Custom Tool** di Dify. AI akan memanggilnya otomatis jika BOD menanyakan tren historis > 6 bulan.

---

## Troubleshooting

| Masalah | Kemungkinan Penyebab | Solusi |
|---|---|---|
| Login gagal | Password salah / user tidak aktif | Cek tabel `users`, pastikan `is_active = true` |
| Upload Excel error "Sheet KPI tidak ditemukan" | Nama sheet berbeda | Rename sheet menjadi `KPI` (huruf kapital) |
| Upload Excel error "Total bobot ≠ 100%" | Bobot salah | Periksa kolom Bobot, pastikan jumlah = 100% |
| AI tidak bisa jawab data dept/unit | — | Pastikan ada data untuk periode tersebut di DB |
| Dify error 502 | API key salah / Dify down | Cek `DIFY_BASE_URL` dan semua API key di `.env.local` |
| Tool Calling Unauthorized | Secret tidak cocok | Pastikan `DIFY_AGENT_SECRET` sama di `.env.local` dan konfigurasi Dify Custom Tool |
| Auto-fetch kurs gagal | No internet / Frankfurter down | Isi manual di form data eksternal |
| Scorecard tidak muncul | Belum ada kpi_items untuk periode ini | Admin upload Excel dulu |

---

## Development Notes

### Menambah Departemen Baru
```sql
INSERT INTO departments (level, name, head_position, unit_name, parent_id)
VALUES ('L2', 'New Department', 'Head of New Dept', NULL, '<parent-uuid>');
```

### Reset Password User
```sql
-- Hash dulu dengan bcrypt (12 rounds), lalu:
UPDATE users SET password_hash = '$2a$12$...' WHERE email = 'user@company.com';
```

### Format Periode
- Format: `YYYY-MM` (contoh: `2025-12` untuk Desember 2025)
- Satu upload = satu dept + satu periode
- Upload ulang dept + periode yang sama → data lama **ditimpa**

---

## Lisensi

Internal use only.
