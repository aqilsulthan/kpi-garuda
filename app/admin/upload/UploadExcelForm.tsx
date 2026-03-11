'use client'
import { useState, useCallback } from 'react'
import * as XLSX from 'xlsx'
import { parseKpiSheet, parseScoreKpiSheet } from '@/lib/parser'
import type { EntityType, ParseResult } from '@/types'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { CheckCircle, AlertTriangle, UploadCloud, FileSpreadsheet, XCircle, ArrowRight } from 'lucide-react'

interface Department { id: string; level: string; name: string; unit_name: string | null }

export default function UploadExcelForm({ departments }: { departments: Department[] }) {
  const [file, setFile] = useState<File | null>(null)
  const [entityType, setEntityType] = useState<EntityType>('department')
  const [deptId, setDeptId] = useState('')
  const [period, setPeriod] = useState('')
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const filteredDepts = departments.filter(d =>
    entityType === 'corporate' ? d.level === 'L1' :
      entityType === 'department' ? d.level === 'L2' :
        d.level === 'L3'
  )

  const handleFile = useCallback(async (f: File) => {
    setFile(f)
    setParseResult(null)
    setMessage(null)

    const buffer = await f.arrayBuffer()
    const wb = XLSX.read(buffer, { type: 'array' })

    const kpiSheet = wb.Sheets['KPI']
    if (!kpiSheet) {
      setMessage({ type: 'error', text: 'Sheet "KPI" tidak ditemukan dalam file ini.' })
      return
    }

    // Convert sheet to array of arrays
    const rows: (string | number | null)[][] = XLSX.utils.sheet_to_json(kpiSheet, {
      header: 1, defval: null,
    })

    const result = parseKpiSheet(rows)

    // Parse score_kpi sheet untuk data aktual
    const scoreSheet = wb.Sheets['score_kpi']
    if (scoreSheet) {
      const scoreRows: (string | number | null)[][] = XLSX.utils.sheet_to_json(scoreSheet, {
        header: 1, defval: null,
      })
      result.actuals = parseScoreKpiSheet(scoreRows)
    }

    setParseResult(result)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f && f.name.endsWith('.xlsx')) handleFile(f)
  }, [handleFile])

  async function handleSubmit() {
    if (!parseResult || !deptId || !period) return
    if (parseResult.validation_errors.length > 0) return

    setUploading(true)
    setMessage(null)

    try {
      const res = await fetch('/api/kpis/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_type: entityType,
          dept_id: deptId,
          period,
          kpi_items: parseResult.kpi_items,
          actuals: parseResult.actuals,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        const actualsMsg = data.actualsInserted > 0 ? ` dan ${data.actualsInserted} data aktual` : ''
        setMessage({ type: 'success', text: `Berhasil menyimpan ${data.inserted} KPI item${actualsMsg} untuk periode ${period}.` })
        setTimeout(() => window.location.reload(), 1500)
      } else {
        setMessage({ type: 'error', text: data.error ?? 'Gagal menyimpan.' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Koneksi ke server gagal.' })
    } finally {
      setUploading(false)
    }
  }

  const selectClassName = "flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors shadow-sm disabled:bg-gray-50 disabled:text-gray-500"

  return (
    <div className="space-y-6">
      {/* Config row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Level KPI</label>
          <select className={selectClassName} value={entityType} onChange={e => { setEntityType(e.target.value as EntityType); setDeptId('') }}>
            <option value="corporate">Corporate (L1)</option>
            <option value="department">Department (L2)</option>
            <option value="unit">Unit (L3)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {entityType === 'unit' ? 'Unit / Sub-Dept' : 'Departemen'}
          </label>
          <select className={selectClassName} value={deptId} onChange={e => setDeptId(e.target.value)}>
            <option value="">— Pilih Entitas —</option>
            {filteredDepts.map(d => (
              <option key={d.id} value={d.id}>
                {d.unit_name ?? d.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Periode (Bulan)</label>
          <Input
            type="month"
            value={period}
            onChange={e => setPeriod(e.target.value)}
          />
        </div>
      </div>

      {/* Dropzone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${file ? 'border-primary-400 bg-primary-50/50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100/50 hover:border-primary-400'}`}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept=".xlsx"
          className="hidden"
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        {file ? (
          <div className="flex flex-col items-center justify-center">
            <FileSpreadsheet size={40} className="text-primary-500 mb-3" />
            <p className="font-semibold text-primary-800 text-lg mb-1">{file.name}</p>
            <p className="text-gray-500 text-sm">{(file.size / 1024).toFixed(1)} KB</p>
            <p className="text-xs text-primary-600 mt-4 underline font-medium">Klik untuk mengganti file</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-500">
            <div className="w-16 h-16 bg-white shadow-sm border border-gray-100 rounded-full flex items-center justify-center mb-4 text-primary-500">
              <UploadCloud size={32} />
            </div>
            <p className="font-medium text-gray-700">Drag & drop file <strong className="text-gray-900">.xlsx</strong> di sini, atau klik untuk memilih files</p>
            <p className="text-xs text-gray-400 mt-2 max-w-sm mx-auto">Pastikan Anda menggunakan format template KPI Excel standar yang telah disepakati.</p>
          </div>
        )}
      </div>

      {/* Validation errors */}
      {parseResult && parseResult.validation_errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 shadow-sm">
          <p className="font-bold text-red-800 text-sm mb-3 flex items-center gap-2">
            <XCircle size={18} /> Validasi Gagal:
          </p>
          <ul className="text-red-700 text-sm space-y-1.5 list-none pl-1">
            {parseResult.validation_errors.map((e, i) => <li key={i} className="flex"><span className="mr-2 opacity-50">•</span> {e}</li>)}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {parseResult && parseResult.warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 shadow-sm">
          <p className="font-bold text-amber-800 text-sm mb-3 flex items-center gap-2">
            <AlertTriangle size={18} /> Peringatan (Bisa dilanjutkan):
          </p>
          <ul className="text-amber-700 text-sm space-y-1.5 list-none pl-1">
            {parseResult.warnings.map((w, i) => <li key={i} className="flex"><span className="mr-2 opacity-50">•</span> {w}</li>)}
          </ul>
        </div>
      )}

      {/* Preview table */}
      {parseResult && parseResult.kpi_items.length > 0 && parseResult.validation_errors.length === 0 && (
        <div className="border border-gray-200/60 rounded-xl overflow-hidden shadow-sm bg-white">
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
            <p className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <CheckCircle size={16} className="text-emerald-500" /> Preview Data — {parseResult.kpi_items.length} KPI Valid
              {parseResult.actuals.length > 0 && (
                <span className="text-emerald-600 font-normal">• {parseResult.actuals.length} data aktual</span>
              )}
            </p>
            <Badge variant="default" className="font-medium">
              Total Bobot: {(parseResult.kpi_items.reduce((s, k) => s + k.bobot, 0) * 100).toFixed(0)}%
            </Badge>
          </div>
          <div className="overflow-x-auto max-h-[300px] scrollbar-thin">
            <table className="w-full text-[13px] text-left">
              <thead className="bg-gray-50 sticky top-0 shadow-sm z-10">
                <tr>
                  {['No', 'Action Verb / KPI', 'Target', 'Aktual', 'Bobot', 'Polaritas', 'Cascaded From'].map((h, i) => (
                    <th key={h} className={`px-4 py-3 font-semibold text-gray-500 ${i === 4 ? 'text-right' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {parseResult.kpi_items.map((item, i) => {
                  const normalizeStr = (s: string) => s.toLowerCase().replace(/[\s\r\n]+/g, '')
                  const actual = parseResult.actuals.find(a => normalizeStr(a.action_verb) === normalizeStr(item.action_verb))
                  return (
                    <tr key={i} className={`hover:bg-primary-50/30 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      <td className="px-4 py-3 text-gray-500 font-medium">{item.no}</td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="truncate font-semibold text-gray-800" title={item.action_verb}>{item.action_verb}</p>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-600">
                        <span className="text-gray-400 text-xs mr-1">from</span> {item.target_from} <ArrowRight size={10} className="inline mx-0.5 text-gray-300" /> {item.target_to} <span className="text-gray-400 text-xs ml-1">{item.parameter}</span>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {actual ? (
                          <span className="text-primary-700 font-bold">{actual.actual_value}</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-gray-600">{(item.bobot * 100).toFixed(0)}%</td>
                      <td className="px-4 py-3">
                        <Badge variant={item.polaritas === 'Max' ? 'success' : 'warning'}>
                          {item.polaritas}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-400 max-w-xs truncate text-[11px] font-medium">{item.cascaded_from || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Submit */}
      {parseResult && parseResult.kpi_items.length > 0 && parseResult.validation_errors.length === 0 && (
        <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
          <Button
            variant="outline"
            onClick={() => { setParseResult(null); setFile(null) }}
          >
            Batal
          </Button>
          <Button
            variant="primary"
            disabled={!deptId || !period || uploading}
            onClick={handleSubmit}
          >
            {uploading ? 'Menyimpan...' : `Confirm & Simpan ${parseResult.kpi_items.length} Item`}
          </Button>
        </div>
      )}

      {/* Result message */}
      {message && (
        <div className={`rounded-xl px-5 py-3.5 text-sm flex items-center gap-2 ${message.type === 'success'
          ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
          : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
          {message.type === 'success' ? <CheckCircle size={18} className="text-emerald-500" /> : <AlertTriangle size={18} className="text-red-500" />}
          {message.text}
        </div>
      )}
    </div>
  )
}
