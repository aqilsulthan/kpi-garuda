// lib/calc.ts — Kalkulasi KPI on-the-fly
// Logika dari Dictionary.xlsx sheet "Logika & Rumus Kalkulasi"
import type { KpiItem, KpiWithActual, DeptScorecard } from '@/types'
import sql from './db'

// ─── Hitung achievement rate berdasarkan polaritas ────────────
export function calcAchRate(
  actual: number,
  target: number,
  polaritas: 'Max' | 'Min'
): number {
  if (target === 0) return 0
  if (polaritas === 'Max') {
    return actual / target
  } else {
    // Polaritas Min: lebih kecil lebih baik (Time-to-Fill, Delay, Deviation)
    return target / actual
  }
}

// ─── Hitung score = ach_rate × bobot ─────────────────────────
export function calcScore(achRate: number, bobot: number): number {
  return achRate * bobot
}

// ─── Tentukan grade berdasarkan total score ───────────────────
export function calcGrade(totalScore: number | null): 'green' | 'yellow' | 'red' | null {
  if (totalScore === null) return null
  if (totalScore >= 0.9) return 'green'
  if (totalScore >= 0.75) return 'yellow'
  return 'red'
}

// ─── Format score sebagai persen ─────────────────────────────
export function formatScore(score: number | null): string {
  if (score === null) return '—'
  return `${(score * 100).toFixed(1)}%`
}

// ─── Ambil scorecard lengkap satu departemen dari DB ─────────
export async function getDeptScorecard(
  deptId: string,
  period: string
): Promise<DeptScorecard | null> {
  // Ambil dept info
  const [dept] = await sql`
    SELECT id, level, name, unit_name
    FROM departments WHERE id = ${deptId}
  `
  if (!dept) return null

  // Ambil KPI items + actuals (LEFT JOIN)
  const rows = await sql`
    SELECT
      ki.id, ki.entity_type, ki.dept_id, ki.period,
      ki.no, ki.objective, ki.action_verb,
      ki.target_from, ki.target_to, ki.parameter,
      ki.bobot, ki.polaritas, ki.cascaded_from,
      ki.key_drivers, ki.remarks,
      ka.actual_value
    FROM kpi_items ki
    LEFT JOIN kpi_actuals ka
      ON ka.kpi_item_id = ki.id AND ka.period = ${period}
    WHERE ki.dept_id = ${deptId} AND ki.period = ${period}
    ORDER BY ki.no ASC
  `

  // Hitung ach_rate & score on-the-fly untuk bulan aktif
  const kpiItems: KpiWithActual[] = rows.map(row => {
    const actual = row.actual_value !== null ? Number(row.actual_value) : null
    const achRate = actual !== null
      ? calcAchRate(actual, Number(row.target_to), row.polaritas)
      : null
    const score = achRate !== null ? calcScore(achRate, Number(row.bobot)) : null

    return {
      ...row,
      target_from: Number(row.target_from),
      target_to: Number(row.target_to),
      bobot: Number(row.bobot),
      actual_value: actual,
      ach_rate: achRate,
      score,
    } as KpiWithActual
  })

  // Ambil data history (6 periode ke belakang)
  const historyRows = await sql`
    SELECT
      ki.action_verb, ki.period, ki.target_to, ki.polaritas, ka.actual_value
    FROM kpi_items ki
    LEFT JOIN kpi_actuals ka ON ka.kpi_item_id = ki.id AND ka.period = ki.period
    WHERE ki.dept_id = ${deptId} AND ki.period <= ${period}
    ORDER BY ki.period ASC
  `

  // Masukkan data history ke masing-masing item
  kpiItems.forEach(kpi => {
    const kpiHistory = historyRows
      .filter(hr => hr.action_verb === kpi.action_verb)
      .slice(-6) // ambil 6 data terakhir
      .map(hr => {
        const hActual = hr.actual_value !== null ? Number(hr.actual_value) : null
        const hAchRate = hActual !== null ? calcAchRate(hActual, Number(hr.target_to), hr.polaritas) : null
        return {
          period: hr.period,
          ach_rate: hAchRate !== null ? Math.min(hAchRate * 100, 150) : null // cap max visual to 150%
        }
      })

    kpi.history = kpiHistory
  })

  // Hitung total score departemen (hanya jika semua aktual sudah diisi)
  const allFilled = kpiItems.every(k => k.actual_value !== null)
  const totalScore = allFilled
    ? kpiItems.reduce((sum, k) => sum + (k.score ?? 0), 0)
    : null

  // Cek status analisis
  const [analysis] = await sql`
    SELECT status FROM analysis_drafts
    WHERE dept_id = ${deptId} AND period = ${period}
    LIMIT 1
  `

  return {
    dept_id: dept.id,
    dept_name: dept.name,
    unit_name: dept.unit_name,
    level: dept.level,
    period,
    kpi_items: kpiItems,
    total_score: totalScore,
    grade: calcGrade(totalScore),
    has_analysis: !!analysis,
    analysis_status: analysis?.status ?? null,
  }
}

// ─── Ambil semua scorecard untuk semua dept dalam satu period ─
export async function getAllScorecards(period: string): Promise<DeptScorecard[]> {
  const depts = await sql`
    SELECT id FROM departments
    WHERE EXISTS (
      SELECT 1 FROM kpi_items
      WHERE dept_id = departments.id AND period = ${period}
    )
    ORDER BY level, name
  `
  const scorecards = await Promise.all(
    depts.map(d => getDeptScorecard(d.id, period))
  )
  return scorecards.filter(Boolean) as DeptScorecard[]
}
