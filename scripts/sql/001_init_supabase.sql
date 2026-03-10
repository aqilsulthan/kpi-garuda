-- =============================================================
-- KPI Management System — Database Migration
-- PostgreSQL / Supabase Compatible
-- Jalankan via Supabase SQL Editor atau:
-- psql -h HOST -U USER -d DATABASE -f 001_init.sql
-- =============================================================

-- ─── EXTENSIONS ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── 1. USERS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(50) NOT NULL CHECK (role IN ('admin','corporate_planning','direksi')),
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- ─── 2. DEPARTMENTS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS departments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level         VARCHAR(5) NOT NULL CHECK (level IN ('L1','L2','L3')),
  name          VARCHAR(255) NOT NULL,
  head_position VARCHAR(255),
  unit_name     VARCHAR(255),
  parent_id     UUID REFERENCES departments(id),
  created_at    TIMESTAMP DEFAULT NOW()
);

-- ─── 3. KPI DICTIONARY ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kpi_dictionary (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_verb         VARCHAR(255) NOT NULL,
  definition          TEXT,
  formula_description TEXT,
  data_source         VARCHAR(255),
  created_at          TIMESTAMP DEFAULT NOW()
);

-- ─── 4. KPI ITEMS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kpi_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type   VARCHAR(20) NOT NULL CHECK (entity_type IN ('corporate','department','unit')),
  dept_id       UUID REFERENCES departments(id),
  period        VARCHAR(7) NOT NULL,
  no            INTEGER NOT NULL,
  objective     TEXT NOT NULL,
  action_verb   VARCHAR(255) NOT NULL,
  target_from   NUMERIC NOT NULL,
  target_to     NUMERIC NOT NULL,
  parameter     VARCHAR(100),
  bobot         NUMERIC NOT NULL CHECK (bobot > 0 AND bobot <= 1),
  polaritas     VARCHAR(5) NOT NULL CHECK (polaritas IN ('Max','Min')),
  cascaded_from VARCHAR(255),
  key_drivers   TEXT,
  remarks       TEXT,
  created_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE(dept_id, period, action_verb)
);

-- ─── 5. KPI ACTUALS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kpi_actuals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_item_id   UUID NOT NULL REFERENCES kpi_items(id) ON DELETE CASCADE,
  actual_value  NUMERIC NOT NULL,
  period        VARCHAR(7) NOT NULL,
  source        VARCHAR(20) DEFAULT 'manual_input'
                CHECK (source IN ('excel_import','manual_input')),
  input_by      UUID REFERENCES users(id),
  input_at      TIMESTAMP DEFAULT NOW(),
  UNIQUE(kpi_item_id, period)
);

-- ─── 6. ANALYSIS DRAFTS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS analysis_drafts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type   VARCHAR(20) NOT NULL,
  dept_id       UUID REFERENCES departments(id),
  period        VARCHAR(7) NOT NULL,
  ai_content    TEXT,
  status        VARCHAR(20) DEFAULT 'draft'
                CHECK (status IN ('draft','approved','published')),
  created_by    UUID REFERENCES users(id),
  approved_by   UUID REFERENCES users(id),
  published_at  TIMESTAMP,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE(dept_id, period)
);

-- ─── 7. EXTERNAL DATA ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS external_data (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period        VARCHAR(7) NOT NULL,
  data_type     VARCHAR(50) NOT NULL,
  value         NUMERIC NOT NULL,
  unit          VARCHAR(50),
  notes         TEXT,
  source        VARCHAR(50) DEFAULT 'manual',
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE(period, data_type)
);

-- ─── 8. UPLOAD LOGS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS upload_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename       VARCHAR(255) NOT NULL,
  entity_type    VARCHAR(20),
  dept_id        UUID REFERENCES departments(id),
  period         VARCHAR(7),
  items_parsed   INTEGER DEFAULT 0,
  actuals_parsed INTEGER DEFAULT 0,
  status         VARCHAR(20) DEFAULT 'success'
                 CHECK (status IN ('success','failed','partial')),
  error_message  TEXT,
  uploaded_by    UUID REFERENCES users(id),
  uploaded_at    TIMESTAMP DEFAULT NOW()
);

-- ─── INDEXES ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_kpi_items_dept_period   ON kpi_items(dept_id, period);
CREATE INDEX IF NOT EXISTS idx_kpi_items_entity_period ON kpi_items(entity_type, period);
CREATE INDEX IF NOT EXISTS idx_kpi_actuals_item_period ON kpi_actuals(kpi_item_id, period);
CREATE INDEX IF NOT EXISTS idx_analysis_dept_period    ON analysis_drafts(dept_id, period);
CREATE INDEX IF NOT EXISTS idx_external_data_period    ON external_data(period);
CREATE INDEX IF NOT EXISTS idx_external_data_type      ON external_data(period, data_type);

-- ─── DEFAULT ADMIN USER ───────────────────────────────────────
-- Password: admin123 (GANTI SEGERA setelah pertama login!)
INSERT INTO users (name, email, password_hash, role)
VALUES (
  'System Admin',
  'admin@company.com',
  '$2a$12$kP5aZszJvqVTtyjeQBc0getdQ9n7fTNP2QA5MPP0c9W3qV5Ml0hzGy',
  'admin'
) ON CONFLICT (email) DO NOTHING;

SELECT 'Migration selesai. Tabel dibuat: users, departments, kpi_dictionary, kpi_items, kpi_actuals, analysis_drafts, external_data, upload_logs' AS status;