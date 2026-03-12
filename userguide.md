# 📊 Panduan Pengguna — Sistem Manajemen KPI Berbasis AI
**Untuk: Board of Directors, Tim Corporate Planning, dan Admin**

> Dokumen ini menjelaskan secara komprehensif cara kerja dan fitur-fitur Sistem KPI dari sudut pandang pengguna maupun teknikal. Dirancang agar dapat di-presentasikan kepada Direksi.

---

## Daftar Isi

1. [Gambaran Umum Sistem](#1-gambaran-umum-sistem)
2. [Siapa Pengguna Sistem Ini?](#2-siapa-pengguna-sistem-ini)
3. [Alur Kerja Utama (End-to-End Flow)](#3-alur-kerja-utama-end-to-end-flow)
4. [Fitur Lengkap per Role](#4-fitur-lengkap-per-role)
   - [Admin](#41-admin)
   - [Corporate Planning](#42-corporate-planning)
   - [Board of Directors (Direksi)](#43-board-of-directors-direksi)
5. [Bagaimana AI Bekerja di Sistem Ini?](#5-bagaimana-ai-bekerja-di-sistem-ini)
6. [Keamanan Sistem](#6-keamanan-sistem)
7. [Penjelasan Teknikal Backend & API](#7-penjelasan-teknikal-backend--api)

---

## 1. Gambaran Umum Sistem

Sistem KPI ini adalah platform **digital terintegrasi** yang menggantikan proses pelaporan KPI berbasis Excel dan analisis manual yang selama ini memakan waktu hingga beberapa hari kerja.

### Masalah yang Dipecahkan

| Sebelum (Manual) | Sesudah (Sistem Ini) |
|---|---|
| Data KPI tersebar di banyak file Excel | Semua data terpusat di satu database |
| Analisis membutuhkan 2–3 hari kerja | Analisis AI selesai dalam < 30 detik |
| Laporan harus di-email manual ke Direksi | Laporan langsung tersedia di dashboard BOD |
| Direksi tidak bisa bertanya langsung ke data | Direksi bisa tanya apapun ke AI Executive Copilot |
| Tidak ada tren historis yang mudah dibaca | Visualisasi tren otomatis per KPI per bulan |

### Prinsip Utama Desain

- **Satu Sumber Kebenaran** — Semua angka berasal dari database yang sama, tidak ada duplikasi.
- **AI sebagai Asisten, bukan Pengganti** — AI membantu mempercepat analisis, tetapi manusia (Corporate Planning) yang memvalidasi dan memutuskan sebelum dikirim ke BOD.
- **Role-based Access** — Setiap pengguna hanya bisa melihat dan melakukan apa yang sesuai jabatannya.

---

## 2. Siapa Pengguna Sistem Ini?

```
┌────────────────────────────────────────────────────────────────┐
│                      PENGGUNA SISTEM                           │
│                                                                │
│  👤 ADMIN              📊 CORPORATE PLANNING    🏢 DIREKSI     │
│  ─────────────         ─────────────────────    ──────────     │
│  • Input data KPI      • Analisis & review      • Baca laporan │
│    dari Excel          • Trigger AI analysis    • Tanya AI     │
│  • Kelola user         • Publish laporan        • Dashboard    │
│  • Input data          • Copilot chat           │              │
│    makro ekonomi       │                        │              │
│  • Hapus data          │                        │              │
└────────────────────────────────────────────────────────────────┘
```

---

## 3. Alur Kerja Utama (End-to-End Flow)

Berikut adalah alur dari data awal hingga sampai ke tangan Direksi:

```
  SETIAP BULAN:

  [1. Admin] ─────────────────────────────────────────────────────
  │
  │  Upload file Excel KPI → Sistem parse & simpan ke database
  │  Input data makro ekonomi (kurs, oil, inflasi, avtur)
  │  ↓
  [2. Corporate Planning] ────────────────────────────────────────
  │
  │  Buka Dashboard Scorecard → Pilih departemen
  │  ↓
  │  Klik "Analisis AI" → Dify + Qwen LLM analisis otomatis
  │  ↓
  │  Baca draft analisis → Edit jika diperlukan → Review
  │  ↓
  │  Gunakan Copilot Chat untuk perkaya konten laporan
  │  ↓
  │  Klik "Kirim ke Direksi" → Status jadi Published
  │  ↓
  [3. Direksi / BOD] ─────────────────────────────────────────────
  │
  │  Buka Dashboard → Pilih laporan yang diterima
  │  ↓
  │  Baca analisis AI + tabel KPI
  │  ↓
  │  Tanyakan ke Executive Copilot AI:
  │  "Kenapa KPI Finance turun bulan ini?"
  │  "Bandingkan performa IT vs HR"
  │  "Apa tren Quality Assurance 2 tahun terakhir?"
  │  ↓
  │  AI menjawab berdasarkan DATA NYATA dari database
  └───────────────────────────────────────────────────────────────
```

---

## 4. Fitur Lengkap per Role

### 4.1 Admin

Admin adalah **pintu masuk data** ke dalam sistem. Semua data KPI dan data pendukung diinput oleh Admin.

#### 📥 Upload KPI dari Excel

**Halaman:** `/admin/upload`

Admin meng-upload file Excel berformat template resmi. Sistem akan:
1. **Membaca dan mem-parse** isi sheet `KPI` secara otomatis
2. **Menampilkan preview tabel** sebelum data disimpan — Admin bisa cek dulu
3. **Memvalidasi** otomatis:
   - Total bobot semua KPI harus tepat **100%**
   - Tidak ada field wajib yang kosong
   - Format periode benar (YYYY-MM)
4. **Menyimpan ke database** — data langsung tersedia untuk Corporate Planning

**Level KPI yang Didukung:**

| Level | Keterangan | Contoh |
|---|---|---|
| **L1 — Corporate** | KPI setingkat Direksi / perusahaan | Safety Index, OTP, Cost Leadership |
| **L2 — Department** | KPI setingkat Departemen | KPI Finance, KPI HRD, KPI IT |
| **L3 — Unit** | KPI setingkat Unit/Sub-bagian | KPI Quality Assurance, KPI Treasury |

> ⚠️ Format template Excel bersifat **baku**. Nama sheet harus `KPI` (kapital). Jika berbeda, sistem akan menolak.

---

#### 🌐 Input Data Makro Ekonomi

**Halaman:** `/admin/upload` (bagian bawah)

Data ekonomi eksternal digunakan oleh AI sebagai **konteks tambahan** saat menganalisis KPI. Contoh: kenaikan harga avtur akan membantu AI menjelaskan kenapa KPI Cost underperform.

| Data | Sumber | Cara Input |
|---|---|---|
| Kurs USD/IDR | Frankfurter API (otomatis) | Klik tombol Auto-Fetch |
| Harga Crude Oil | EIA API (otomatis) | Klik tombol Auto-Fetch |
| Tingkat Inflasi | BPS API (otomatis) | Klik tombol Auto-Fetch |
| Harga Avtur | Manual | Input langsung di form |
| Market Share | Manual | Input langsung di form |

**Auto-Fetch** berarti sistem mengambil data terbaru dari API resmi tanpa Admin harus mencarinya sendiri. Data yang sudah ada di database tidak akan diambil ulang (efisien).

---

#### 👥 Kelola User

**Halaman:** `/admin/users`

Admin dapat:
- **Tambah akun** baru untuk tim (nama, email, password, role)
- **Lihat daftar** semua user aktif
- **Hapus** akun yang tidak digunakan lagi

---

#### 🗑️ Kelola & Hapus Data KPI

**Halaman:** `/admin/kpi-list`

Admin dapat melihat semua data KPI yang sudah terupload, dikelompokkan per periode. Pilihan hapus:
- Hapus **satu departemen/unit** untuk periode tertentu
- Hapus **seluruh periode** (semua dept di satu bulan)

---

### 4.2 Corporate Planning

Corporate Planning adalah **pengguna utama** sistem ini. Mereka bertugas mengolah data KPI mentah menjadi laporan analisis berkualitas tinggi untuk Direksi.

#### 📊 Dashboard Scorecard

**Halaman:** `/planning`

Setelah login, Corporate Planning melihat **daftar semua periode** yang memiliki data KPI. Setiap periode menampilkan ringkasan jumlah entitas yang sudah memiliki data.

---

#### 🏋️ AI Workspace

**Halaman:** `/planning/[periode]`

Ini adalah halaman kerja utama Corporate Planning. Terdiri dari:

**Panel Kiri — Scorecard Navigator:**
- Daftar semua departemen dan unit dengan **grade berwarna**:
  - 🟢 **Hijau** — Total skor ≥ 90% (On Target)
  - 🟡 **Kuning** — Total skor 75–89% (Perlu Perhatian)
  - 🔴 **Merah** — Total skor < 75% (Kritis)
- Status laporan: `Published` (sudah dikirim BOD) atau `Draft`
- Data Makro Ekonomi ringkas di bagian bawah

**Panel Kanan — Detail & AI:**

Saat memilih satu departemen, panel kanan menampilkan:

1. **Tabel KPI Lengkap** — semua indikator dengan:
   - Target (From–To) dan nilai aktual
   - Tingkat pencapaian (ach_rate %)
   - Skor akhir berbobot
   - **Grafik tren 6 bulan** per KPI (mini sparkline)

2. **3 Tombol AI:**

   | Tombol | Fungsi | Output |
   |---|---|---|
   | 🔍 **Analisis AI** | Analisis mendalam KPI underperform + root cause | Teks analisis naratif |
   | 📋 **Buat Ringkasan** | Executive summary ringkas untuk BOD | Ringkasan 200–300 kata |
   | 💡 **Rekomendasi** | Saran improvement actionable per KPI merah | Daftar rekomendasi terstruktur |

3. **Editor Laporan** — Hasil AI langsung bisa **diedit secara manual** di browser (contentEditable). Corporate Planning bisa memodifikasi teks sebelum dikirim ke BOD.

4. **Copilot Chat** — Sidebar chat untuk berinteraksi dengan AI tepat di samping editor:
   - *"Tambahkan dampak kenaikan avtur ke analisis Cost Leadership"*
   - *"Buat kalimat pembuka yang lebih formal"*
   - *"Jelaskan KPI Infrastructure dengan bahasa yang lebih mudah dipahami Direksi"*
   - AI membaca seluruh konteks KPI departemen yang sedang dibuka

5. **Tombol "Kirim ke Direksi"** — Setelah laporan siap, klik untuk **mempublikasikan**. Laporan akan langsung tersedia di dashboard Direksi.

---

### 4.3 Board of Directors (Direksi)

Direksi memiliki dua akses utama: **membaca laporan** yang dikirimkan Corporate Planning, dan **bertanya langsung ke AI** tentang kondisi KPI perusahaan secara real-time.

#### 📄 Laporan Analisis

**Halaman:** `/board/[periode]`

**Panel Kiri:**
- Daftar semua laporan yang sudah dipublikasikan untuk periode tersebut
- Dikelompokkan per departemen/unit

**Panel Utama:**
- Konten laporan analisis lengkap dari Corporate Planning (sudah divalidasi manusia)
- Informasi: periode, tanggal dikirim

**Executive Assistant AI (sidebar kanan):**
- Diskusikan laporan dengan AI secara langsung
- Semua jawaban berbasis konten laporan aktual
- AI merender jawaban dengan format yang rapi (judul, bold, poin list, dll)

---

#### 💬 Executive Copilot AI

**Halaman:** `/chat` (khusus Direksi)

Ini adalah fitur **chatbot khusus Direksi** yang paling canggih. Setiap kali Direksi membuka halaman ini:

**Yang terjadi di balik layar (otomatis):**
1. Server mengambil **semua data KPI periode terbaru** dari database
2. Data mencakup: **L1 Corporate** (detail penuh) + **L2 semua Departemen** + **L3 semua Unit** (lengkap dengan KPI items)
3. Data **makro ekonomi terkini** juga disisipkan
4. Semua ini dikirim sebagai konteks ke Dify AI Agent

**Apa yang bisa Direksi tanyakan:**

| Pertanyaan | Kemampuan AI |
|---|---|
| "Berapa KPI Corporate Desember 2025?" | ✅ Jawab dengan detail semua KPI L1 |
| "Bagaimana kinerja departemen Finance?" | ✅ Jawab detail KPI L2 Finance |
| "KPI Unit Quality Assurance bulan ini?" | ✅ Jawab detail KPI L3 QA |
| "Departemen mana yang paling buruk?" | ✅ Bandingkan semua level |
| "Apa tren KPI IT 2 tahun terakhir?" | ✅ Tool Calling ke database historis |
| "Kenapa Cost Leadership turun?" | ✅ Analisis dengan konteks makro |

**Fitur tambahan:**
- **Riwayat Chat** — Tersimpan di database, bisa dilanjutkan di sesi berikutnya
- **Multi-conversation** — Bisa mulai topik baru tanpa menghilangkan percakapan lama
- **Format Markdown** — Jawaban AI merender tabel, bold, heading, dan poin list dengan rapi

---

## 5. Bagaimana AI Bekerja di Sistem Ini?

Sistem menggunakan **3 jenis AI** dengan fungsi yang berbeda:

### 🔧 AI #1: KPI Analyst (Workflow)
- **Digunakan di:** Halaman Planning — tombol Analisis, Ringkasan, Rekomendasi
- **Cara kerja:** Corporate Planning klik tombol → sistem kirim data KPI + data makro → Dify jalankan workflow → Qwen LLM hasilkan teks analisis → tampil di editor
- **Karakteristik:** Satu kali generate, output berupa dokumen naratif panjang

### 💬 AI #2: KPI Assistant (Chatflow)
- **Digunakan di:** Sidebar chat di Planning Workspace + Corporate Planning
- **Cara kerja:** Percakapan dua arah, AI memiliki memori dalam satu sesi chat
- **Konteks yang dikirim:** Data KPI departemen yang sedang dibuka + draft laporan saat ini

### 🤖 AI #3: BOD Executive Agent (Agent + Tool Calling)
- **Digunakan di:** `/chat` khusus Direksi
- **Cara kerja:**
  1. Saat chat dibuka → semua data KPI semua level + makro ekonomi otomatis disisipkan ke prompt
  2. Jika Direksi tanya tentang tren historis panjang → AI secara mandiri memanggil API `/api/agent/get-kpi-trend` (Tool Calling) untuk mendapatkan data lebih dalam
  3. AI merangkum jawaban dalam format yang mudah dibaca BOD
- **Karakteristik:** Streaming (jawaban muncul kata per kata), paling canggih dan interaktif

### Prinsip Keamanan Data AI

> **AI TIDAK PERNAH mengarang data.** Setiap angka yang disebutkan AI berasal dari data aktual di database. Ini dijamin dengan instruksi sistem yang ketat (*"Jangan mengarang angka, JAWAB berdasarkan context JSON"*) yang disisipkan ke setiap request ke Dify.

---

## 6. Keamanan Sistem

| Lapisan | Mekanisme | Keterangan |
|---|---|---|
| **Autentikasi** | NextAuth.js v5 (JWT) | Login wajib, session expire otomatis |
| **Otorisasi** | Role-based Middleware | Admin, Corporate Planning, Direksi punya akses berbeda |
| **API Protection** | Session check setiap request | Semua API `/api/*` cek session kecuali `/api/agent/*` |
| **Agent API** | Bearer Token (`DIFY_AGENT_SECRET`) | Endpoint Tool Calling diamankan dengan secret key khusus |
| **Password** | bcrypt (12 rounds) | Password tidak pernah disimpan plaintext |
| **Database** | SSL connection | Koneksi ke PostgreSQL dienkripsi |

---

## 7. Penjelasan Teknikal Backend & API

Bagian ini untuk tim IT dan developer yang ingin memahami bagaimana sistem bekerja secara teknikal.

### Arsitektur Request-Response

```
Browser / Dify AI
    │
    │  HTTP Request
    ▼
Next.js API Routes (/app/api/*)
    │
    ├── Auth check (NextAuth session)
    ├── Business logic
    ├── Query ke PostgreSQL (via lib/calc.ts, lib/db.ts)
    └── Call ke Dify jika diperlukan (via lib/dify.ts)
    │
    │  JSON Response
    ▼
Browser / Dify AI
```

### Kalkulasi KPI — Cara Kerjanya

Sistem **tidak menyimpan** skor KPI di database. Skor dihitung ulang setiap kali data diminta:

```
Fungsi: getDeptScorecard(dept_id, period)
├── Query: ambil semua kpi_items untuk dept + period
├── LEFT JOIN kpi_actuals untuk nilai aktual
├── Loop setiap KPI item:
│   ├── Hitung ach_rate berdasarkan polaritas
│   │   ├── MAX: ach_rate = actual / target_to
│   │   └── MIN: ach_rate = target_to / actual
│   ├── Hitung score = ach_rate × bobot
│   └── Ambil history 6 bulan untuk sparkline
├── Hitung total_score = Σ(score[])
├── Tentukan grade (green/yellow/red)
└── Cek status analysis_draft
```

Keuntungan pendekatan ini: data **selalu akurat** dan tidak ada risiko inkonsistensi antara data mentah dan skor tampil.

### Context Injection ke AI (BOD Chat)

Ini adalah teknik utama yang membuat AI bisa menjawab pertanyaan spesifik tentang perusahaan:

```
POST /api/integrations/dify (type: "chat", context.general_chat: true)
    │
    ├── Ambil semua scorecard dari getAllScorecards(period)
    │   ├── L1 → full detail dengan semua KPI items
    │   └── L2 + L3 → full detail semua KPI items
    │
    ├── Ambil data makro ekonomi dari gatherExternalMacroData(period)
    │
    ├── Susun context JSON:
    │   {
    │     kpi_data: {
    │       corporate_l1: [...],        ← L1 full KPI detail
    │       departments_and_units: [...] ← L2+L3 full KPI detail
    │     },
    │     external_data: [...],
    │     info: "Instruksi ke AI..."
    │   }
    │
    └── Kirim ke Dify dengan context tersebut → AI jawab berdasarkan data nyata
```

### Tool Calling — Drill-down Historis

Jika BOD bertanya tentang tren panjang, AI memanggil endpoint ini secara mandiri:

```
GET /api/agent/get-kpi-trend?dept_name=Finance&months=24
Authorization: Bearer <DIFY_AGENT_SECRET>
    │
    ├── Validasi Bearer token
    ├── Cari departemen di DB (fuzzy match nama)
    ├── Query semua KPI history untuk dept tersebut (24 bulan ke belakang)
    ├── Hitung ach_rate per bulan per KPI
    └── Return JSON:
        {
          dept_info: { name, level },
          months_fetched: 24,
          metrics: [
            {
              kpi_name: "...",
              history: [
                { period: "2024-01", actual: X, target: Y, ach_rate_pct: Z },
                ...
              ]
            }
          ]
        }
```

### Database Schema (Ringkasan)

| Tabel | Fungsi |
|---|---|
| `users` | Akun user + role + bcrypt password |
| `departments` | Hirarki organisasi (L1/L2/L3) + parent-child |
| `kpi_items` | Data KPI per dept per periode (target, bobot, polaritas) |
| `kpi_actuals` | Nilai aktual per KPI item per periode |
| `analysis_drafts` | Laporan AI yang sudah dibuat/dipublikasikan |
| `external_data` | Data makro ekonomi per periode |
| `chat_messages` | Riwayat percakapan AI per user |

---

## Ringkasan Nilai Bisnis Sistem

| Aspek | Nilai |
|---|---|
| ⏰ **Kecepatan analisis** | Dari 2–3 hari → < 1 menit |
| 📊 **Cakupan data** | Semua level (L1, L2, L3) terakomodasi |
| 🤖 **Kualitas AI** | Qwen LLM dengan konteks data nyata perusahaan |
| 🔒 **Keamanan** | Role-based access, data tidak bocor antar role |
| 📱 **Aksesibilitas** | Web-based, bisa diakses dari device manapun |
| 💬 **Interaktivitas** | Direksi bisa tanya-jawab real-time dengan data |
| 📈 **Historis** | Tren hingga 36 bulan ke belakang tersedia |

---

*Dokumen ini dibuat untuk keperluan presentasi dan serah terima sistem.*
*Versi: Maret 2026*
