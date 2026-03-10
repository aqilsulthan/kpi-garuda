-- =============================================================
-- KPI Management System — Database Migration
-- Compatible with Greenplum Database (GPDB)
-- Jalankan: psql -h HOST -U USER -d DATABASE -f 001_init.sql
-- =============================================================

-- ─── UUID HELPER ─────────────────────────────────────────────
-- Greenplum may not allow "CREATE EXTENSION pgcrypto" for
-- non-superusers. We create a helper function using random()
-- that produces v4-style UUIDs without pgcrypto.
-- If your cluster already has uuid-ossp or pgcrypto installed
-- by the DBA, you can remove this block.
CREATE OR REPLACE FUNCTION public.gp_random_uuid()
RETURNS UUID AS $$
SELECT (
  lpad(to_hex((random()*x'ffffffff'::int)::int), 8, '0') || '-' ||
  lpad(to_hex((random()*x'ffff'::int)::int),     4, '0') || '-' ||
  '4' || lpad(to_hex((random()*x'fff'::int)::int), 3, '0') || '-' ||
  to_hex(8 + (random()*3)::int) ||
           lpad(to_hex((random()*x'fff'::int)::int), 3, '0') || '-' ||
  lpad(to_hex((random()*x'ffffffffffff'::bigint)::bigint), 12, '0')
)::UUID;
$$ LANGUAGE sql VOLATILE;

-- ─── 1. USERS ─────────────────────────────────────────────────
-- Distributed by (id) — id is in PK, so no conflict.
CREATE TABLE IF NOT EXISTS users (
  id            UUID DEFAULT gp_random_uuid(),
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(50) NOT NULL CHECK (role IN ('admin','corporate_planning','direksi')),
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id)
) DISTRIBUTED BY (id);

-- Unique index on email (Greenplum requires dist key in unique constraint,
-- so we use a plain index instead of UNIQUE constraint for email)
CREATE INDEX idx_users_email ON users(email);

-- ─── 2. DEPARTMENTS ───────────────────────────────────────────
-- Seed dari Dictionary.xlsx sheet hirarki_PTX
CREATE TABLE IF NOT EXISTS departments (
  id            UUID DEFAULT gp_random_uuid(),
  level         VARCHAR(5) NOT NULL CHECK (level IN ('L1','L2','L3')),
  name          VARCHAR(255) NOT NULL,          -- nama departemen/unit
  head_position VARCHAR(255),                   -- jabatan kepala
  unit_name     VARCHAR(255),                   -- diisi jika L3
  parent_id     UUID,                           -- logical FK to departments(id)
  created_at    TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id)
) DISTRIBUTED BY (id);

-- ─── 3. KPI DICTIONARY ────────────────────────────────────────
-- Seed dari Dictionary.xlsx sheet KPI Dictionary
CREATE TABLE IF NOT EXISTS kpi_dictionary (
  id                  UUID DEFAULT gp_random_uuid(),
  action_verb         VARCHAR(255) NOT NULL,
  definition          TEXT,
  formula_description TEXT,
  data_source         VARCHAR(255),
  created_at          TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id)
) DISTRIBUTED BY (id);

-- ─── 4. KPI ITEMS ─────────────────────────────────────────────
-- Dari sheet "KPI" setiap file upload
-- DISTRIBUTED BY (id) — the composite unique (dept_id, period, action_verb)
-- is enforced via a unique index instead of table-level UNIQUE constraint
-- because Greenplum requires the dist key in all unique constraints.
CREATE TABLE IF NOT EXISTS kpi_items (
  id            UUID DEFAULT gp_random_uuid(),
  entity_type   VARCHAR(20) NOT NULL CHECK (entity_type IN ('corporate','department','unit')),
  dept_id       UUID,                           -- logical FK to departments(id)
  period        VARCHAR(7) NOT NULL,            -- format: 2025-03
  no            INTEGER NOT NULL,
  objective     TEXT NOT NULL,
  action_verb   VARCHAR(255) NOT NULL,
  target_from   NUMERIC NOT NULL,
  target_to     NUMERIC NOT NULL,
  parameter     VARCHAR(100),
  bobot         NUMERIC NOT NULL CHECK (bobot > 0 AND bobot <= 1),
  polaritas     VARCHAR(5) NOT NULL CHECK (polaritas IN ('Max','Min')),
  cascaded_from VARCHAR(255),
  key_drivers   TEXT,                           -- multi-baris digabung \n
  remarks       TEXT,
  created_at    TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id)
) DISTRIBUTED BY (id);

CREATE INDEX idx_kpi_items_dept_verb_period ON kpi_items(dept_id, period, action_verb);

-- ─── 5. KPI ACTUALS ───────────────────────────────────────────
-- Dari sheet score_kpi (jika ada) atau input manual via UI
-- ach_rate & score TIDAK disimpan — dihitung on-the-fly
CREATE TABLE IF NOT EXISTS kpi_actuals (
  id            UUID DEFAULT gp_random_uuid(),
  kpi_item_id   UUID NOT NULL,                  -- logical FK to kpi_items(id)
  actual_value  NUMERIC NOT NULL,
  period        VARCHAR(7) NOT NULL,
  source        VARCHAR(20) DEFAULT 'manual_input'
                CHECK (source IN ('excel_import','manual_input')),
  input_by      UUID,                           -- logical FK to users(id)
  input_at      TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id)
) DISTRIBUTED BY (id);

CREATE INDEX idx_kpi_actuals_item_period ON kpi_actuals(kpi_item_id, period);

-- ─── 6. ANALYSIS DRAFTS ───────────────────────────────────────
-- Output AI dari Dify Workflow, proses review & publish
CREATE TABLE IF NOT EXISTS analysis_drafts (
  id            UUID DEFAULT gp_random_uuid(),
  entity_type   VARCHAR(20) NOT NULL,
  dept_id       UUID,                           -- logical FK to departments(id)
  period        VARCHAR(7) NOT NULL,
  ai_content    TEXT,                           -- output Qwen via Dify
  status        VARCHAR(20) DEFAULT 'draft'
                CHECK (status IN ('draft','approved','published')),
  created_by    UUID,                           -- logical FK to users(id)
  approved_by   UUID,                           -- logical FK to users(id)
  published_at  TIMESTAMP,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id)
) DISTRIBUTED BY (id);

CREATE INDEX idx_analysis_dept_period ON analysis_drafts(dept_id, period);

-- ─── 7. EXTERNAL DATA ─────────────────────────────────────────
-- Data konteks untuk AI: fuel, market share, kurs, dll
CREATE TABLE IF NOT EXISTS external_data (
  id            UUID DEFAULT gp_random_uuid(),
  period        VARCHAR(7) NOT NULL,
  data_type     VARCHAR(50) NOT NULL,           -- fuel_price, market_share, usd_idr, dll
  value         NUMERIC NOT NULL,
  unit          VARCHAR(50),                    -- IDR/liter, %, USD/IDR, dll
  notes         TEXT,
  source        VARCHAR(50) DEFAULT 'manual',   -- manual, api_frankfurter, api_eia, api_bps
  created_by    UUID,                           -- logical FK to users(id)
  created_at    TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id)
) DISTRIBUTED BY (id);

CREATE INDEX idx_external_data_period ON external_data(period);
CREATE INDEX idx_external_data_period_type ON external_data(period, data_type);

-- ─── 8. UPLOAD LOGS ───────────────────────────────────────────
-- History setiap upload file oleh admin
CREATE TABLE IF NOT EXISTS upload_logs (
  id            UUID DEFAULT gp_random_uuid(),
  filename      VARCHAR(255) NOT NULL,
  entity_type   VARCHAR(20),
  dept_id       UUID,                           -- logical FK to departments(id)
  period        VARCHAR(7),
  items_parsed  INTEGER DEFAULT 0,
  actuals_parsed INTEGER DEFAULT 0,
  status        VARCHAR(20) DEFAULT 'success'
                CHECK (status IN ('success','failed','partial')),
  error_message TEXT,
  uploaded_by   UUID,                           -- logical FK to users(id)
  uploaded_at   TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id)
) DISTRIBUTED BY (id);

-- ─── ADDITIONAL INDEXES ──────────────────────────────────────
CREATE INDEX idx_kpi_items_dept_period   ON kpi_items(dept_id, period);
CREATE INDEX idx_kpi_items_entity_period ON kpi_items(entity_type, period);

-- ─── DEFAULT ADMIN USER ───────────────────────────────────────
-- Password: admin123 (GANTI SEGERA setelah pertama login!)
INSERT INTO users (name, email, password_hash, role)
VALUES (
  'System Admin',
  'admin@company.com',
  '$2a$12$kP5aZszJvqVTtyjeQBc0getdQ9n7fTNP2QA5MPP0c9W3qV5Ml0hzGy',
  'admin'
);

SELECT 'Migration selesai. Tabel dibuat: users, departments, kpi_dictionary, kpi_items, kpi_actuals, analysis_drafts, external_data, upload_logs' AS status;
