// =============================================================
// Types — KPI Management System
// =============================================================

export type Role = 'admin' | 'corporate_planning' | 'direksi'
export type EntityType = 'corporate' | 'department' | 'unit'
export type Polaritas = 'Max' | 'Min'
export type AnalysisStatus = 'draft' | 'approved' | 'published'
export type UploadSource = 'excel_import' | 'manual_input'
export type DifyAction = 'analyze' | 'summarize' | 'suggest'

// ─── Database Models ──────────────────────────────────────────
export interface User {
  id: string
  name: string
  email: string
  role: Role
  is_active: boolean
  created_at: string
}

export interface Department {
  id: string
  level: 'L1' | 'L2' | 'L3'
  name: string
  head_position: string | null
  unit_name: string | null
  parent_id: string | null
}

export interface KpiItem {
  id: string
  entity_type: EntityType
  dept_id: string
  period: string
  no: number
  objective: string
  action_verb: string
  target_from: number
  target_to: number
  parameter: string | null
  bobot: number
  polaritas: Polaritas
  cascaded_from: string | null
  key_drivers: string | null
  remarks: string | null
}

export interface KpiActual {
  id: string
  kpi_item_id: string
  actual_value: number
  period: string
  source: UploadSource
  input_at: string
}

export interface AnalysisDraft {
  id: string
  entity_type: EntityType
  dept_id: string
  period: string
  ai_content: string | null
  status: AnalysisStatus
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface ExternalData {
  id: string
  period: string
  data_type: string
  value: number
  unit: string | null
  notes: string | null
  source: string
  created_at: string
}

// ─── Computed / View Models ───────────────────────────────────
export interface KpiWithActual extends KpiItem {
  actual_value: number | null
  ach_rate: number | null   // dihitung on-the-fly
  score: number | null      // dihitung on-the-fly
  history?: { period: string; ach_rate: number | null }[] // riwayat 3 bulan terakhir
}

export interface DeptScorecard {
  dept_id: string
  dept_name: string
  unit_name: string | null
  level: string
  period: string
  kpi_items: KpiWithActual[]
  total_score: number | null
  grade: 'green' | 'yellow' | 'red' | null
  has_analysis: boolean
  analysis_status: AnalysisStatus | null
}

// ─── Parser Types ─────────────────────────────────────────────
export interface ParsedKpiItem {
  no: number
  objective: string
  action_verb: string
  target_from: number
  target_to: number
  parameter: string
  bobot: number
  polaritas: Polaritas
  cascaded_from: string
  key_drivers: string
  remarks: string
}

export interface ParsedActual {
  action_verb: string
  actual_value: number
}

export interface ParseResult {
  kpi_items: ParsedKpiItem[]
  actuals: ParsedActual[]
  validation_errors: string[]
  warnings: string[]
}

// ─── API Request/Response Types ───────────────────────────────
export interface UploadRequest {
  entity_type: EntityType
  dept_id: string
  period: string
  kpi_items: ParsedKpiItem[]
  actuals: ParsedActual[]
}

export interface DifyWorkflowRequest {
  action: DifyAction
  dept_name: string
  period: string
  kpi_data: KpiWithActual[]
  external_data: ExternalData[]
}

export interface DifyWorkflowResponse {
  result: string
  error?: string
}

export interface DifyChatRequest {
  query: string
  conversation_id: string | null
  role: Role
  context: object
}

export interface DifyChatResponse {
  answer: string
  conversation_id: string
}

// ─── External Data Types ──────────────────────────────────────
export interface ExternalDataFetchResult {
  usd_idr?: number
  crude_oil?: number
  inflation?: number
  errors: string[]
}

// ─── NextAuth Session Extension ───────────────────────────────
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      role: Role
    }
  }
  interface User {
    id: string
    role: Role
  }
}
