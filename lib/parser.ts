// lib/parser.ts — Excel Parser Universal
// Handles: Corporate (10 col) | Department (11 col) | Unit (13 col, multi-row key drivers)
// Strategy: map by header name (bukan posisi), merge duplicate No. rows

import type { ParseResult, ParsedKpiItem, ParsedActual, Polaritas } from '@/types'

// ─── Normalisasi nama header ──────────────────────────────────
const HEADER_ALIASES: Record<string, string> = {
  'no.': 'no',
  'no': 'no',
  'objective sentence': 'objective',
  'action verb/kpi': 'action_verb',
  'from': 'target_from',
  'from (2024)': 'target_from',
  'from (2023)': 'target_from',
  'to': 'target_to',
  'to (2025)': 'target_to',
  'to (2024)': 'target_to',
  'parameters': 'parameter',
  'parameter': 'parameter',
  'bobot (%)': 'bobot',
  'bobot': 'bobot',
  'polaritas': 'polaritas',
  'remarks': 'remarks',
  'key driver (smart principles)': 'key_drivers',
  'key driver': 'key_drivers',
  'cascaded from direksi': 'cascaded_from',
  'cascaded from dept. engineering': 'cascaded_from',
  'cascaded from dept. finance': 'cascaded_from',
  'cascaded from dept. human resource': 'cascaded_from',
  'cascaded from dept. it': 'cascaded_from',
  'cascaded from dept. commercial': 'cascaded_from',
  // kolom yang diabaikan (diambil dari UI)
  'departemen': '__ignore',
  'unit': '__ignore',
}

function normalizeHeader(raw: string | null | undefined): string {
  if (!raw) return '__unknown'
  return HEADER_ALIASES[raw.toString().trim().toLowerCase()] ?? '__unknown'
}

// ─── Parse nilai numerik dari berbagai format ─────────────────
function parseNumber(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null
  if (typeof val === 'number') return val
  const str = val.toString().replace(/%/g, '').replace(/,/g, '.').trim()
  const num = parseFloat(str)
  return isNaN(num) ? null : num
}

// ─── Main Parser — dipanggil dari API route ───────────────────
// workbook: objek hasil SheetJS read di client, dikirim sebagai JSON rows
export function parseKpiSheet(
  rows: (string | number | null)[][]
): ParseResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!rows || rows.length < 2) {
    return { kpi_items: [], actuals: [], validation_errors: ['Sheet KPI kosong atau tidak memiliki data.'], warnings: [] }
  }

  // 1. Baca header row, normalisasi
  const rawHeaders = rows[0].map(h => h?.toString() ?? '')
  const headers = rawHeaders.map(normalizeHeader)

  // 2. Cek kolom wajib
  const required = ['no', 'objective', 'action_verb', 'target_to', 'bobot', 'polaritas']
  for (const req of required) {
    if (!headers.includes(req)) {
      errors.push(`Kolom wajib tidak ditemukan: "${req}". Pastikan menggunakan template yang benar.`)
    }
  }
  if (errors.length) return { kpi_items: [], actuals: [], validation_errors: errors, warnings }

  // 3. Helper ambil nilai dari row berdasarkan field name
  const get = (row: (string | number | null)[], field: string) => {
    const idx = headers.indexOf(field)
    return idx >= 0 ? row[idx] : null
  }

  // 4. Parse rows & merge key drivers (Unit level punya multi-row per KPI)
  const itemMap = new Map<number, ParsedKpiItem>()

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    // Skip baris kosong
    if (!row || row.every(c => c === null || c === '')) continue

    const no = parseNumber(get(row, 'no'))
    if (no === null) continue

    const keyDriverRaw = get(row, 'key_drivers')?.toString().trim() ?? ''

    if (itemMap.has(no)) {
      // Baris duplikat (Unit level) — append key driver saja
      const existing = itemMap.get(no)!
      if (keyDriverRaw && !existing.key_drivers.includes(keyDriverRaw)) {
        existing.key_drivers += '\n' + keyDriverRaw
      }
      continue
    }

    // Baris baru
    const bobotRaw = parseNumber(get(row, 'bobot'))
    // Normalize bobot: jika > 1 berarti dalam %, convert ke desimal
    const bobot = bobotRaw !== null ? (bobotRaw > 1 ? bobotRaw / 100 : bobotRaw) : 0

    const polVal = get(row, 'polaritas')?.toString().trim()
    const polaritas: Polaritas = polVal === 'Min' ? 'Min' : 'Max'

    const item: ParsedKpiItem = {
      no,
      objective: get(row, 'objective')?.toString().trim() ?? '',
      action_verb: get(row, 'action_verb')?.toString().trim() ?? '',
      target_from: parseNumber(get(row, 'target_from')) ?? 0,
      target_to: parseNumber(get(row, 'target_to')) ?? 0,
      parameter: get(row, 'parameter')?.toString().trim() ?? '',
      bobot,
      polaritas,
      cascaded_from: get(row, 'cascaded_from')?.toString().trim() ?? '',
      key_drivers: keyDriverRaw,
      remarks: get(row, 'remarks')?.toString().trim() ?? '',
    }

    // Validasi per baris
    if (!item.action_verb) errors.push(`Baris ${i + 1}: Action Verb/KPI kosong.`)
    if (!item.objective) errors.push(`Baris ${i + 1}: Objective kosong.`)
    if (item.target_to === 0 && polaritas === 'Max') warnings.push(`Baris ${i + 1}: Target (To) bernilai 0.`)
    if (!['Max', 'Min'].includes(item.polaritas)) errors.push(`Baris ${i + 1}: Polaritas tidak valid (harus Max atau Min).`)

    itemMap.set(no, item)
  }

  const kpi_items = Array.from(itemMap.values())

  // 5. Validasi total bobot
  if (kpi_items.length > 0) {
    const totalBobot = kpi_items.reduce((s, k) => s + k.bobot, 0)
    if (Math.abs(totalBobot - 1) > 0.005) {
      errors.push(`Total bobot = ${(totalBobot * 100).toFixed(1)}%, harus tepat 100%.`)
    }
  }

  return { kpi_items, actuals: [], validation_errors: errors, warnings }
}

// ─── Header aliases untuk sheet score_kpi ────────────────────
const SCORE_HEADER_ALIASES: Record<string, string> = {
  'action verb/kpi': 'action_verb',
  'action verb / kpi': 'action_verb',
  'action verb': 'action_verb',
  'kpi': 'action_verb',
  'target': 'target',
  'ytd actual': 'actual_value',
  'actual ytd': 'actual_value',
  'actual': 'actual_value',
  'aktual': 'actual_value',
  'realisasi': 'actual_value',
  'polaritas': 'polaritas',
  'bobot': 'bobot',
  'status': '__ignore',
  'ach. rate': '__ignore',
  'ach rate': '__ignore',
  'score': '__ignore',
}

function normalizeScoreHeader(raw: string | null | undefined): string {
  if (!raw) return '__unknown'
  const clean = raw.toString().trim().toLowerCase().replace(/\s+/g, ' ')
  return SCORE_HEADER_ALIASES[clean] ?? '__unknown'
}

// ─── Parse sheet score_kpi (data aktual) ─────────────────────
// Membaca kolom "Action Verb/KPI" dan "YTD Actual" dari sheet score_kpi
export function parseScoreKpiSheet(
  rows: (string | number | null)[][]
): ParsedActual[] {
  if (!rows || rows.length < 2) return []

  const rawHeaders = rows[0].map(h => h?.toString() ?? '')
  const headers = rawHeaders.map(normalizeScoreHeader)

  const colAction = headers.indexOf('action_verb')
  const colActual = headers.indexOf('actual_value')

  // Jika kolom wajib tidak ditemukan, return kosong
  if (colAction < 0 || colActual < 0) return []

  const actuals: ParsedActual[] = []

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.every(c => c === null || c === '')) continue

    const actionVerb = row[colAction]?.toString().trim() ?? ''
    if (!actionVerb) continue

    // Skip baris summary (TOTAL SCORE ...)
    if (actionVerb.toUpperCase().startsWith('TOTAL SCORE')) continue

    const actualVal = parseNumber(row[colActual])
    if (actualVal === null) continue

    actuals.push({
      action_verb: actionVerb,
      actual_value: actualVal,
    })
  }

  return actuals
}
