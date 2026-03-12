'use client'
import { useState, useCallback } from 'react'
import * as XLSX from 'xlsx'
import { parseKpiSheet, parseScoreKpiSheet } from '@/lib/parser'
import type { EntityType, ParseResult } from '@/types'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import MonthPicker from '@/components/ui/MonthPicker'
import { CheckCircle, AlertTriangle, UploadCloud, FileSpreadsheet, XCircle, Trash2, Loader2, Info } from 'lucide-react'

interface Department { id: string; level: string; name: string; unit_name: string | null }

interface FileWithMetadata {
  id: string
  file: File
  entityType: EntityType
  deptId: string
  period: string
  parseResult: ParseResult | null
  status: 'pending' | 'uploading' | 'success' | 'error'
  message?: string
}

export default function UploadExcelForm({ departments }: { departments: Department[] }) {
  const [fileList, setFileList] = useState<FileWithMetadata[]>([])
  const [globalUploading, setGlobalUploading] = useState(false)
  const [mainMessage, setMainMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const parseFileMetadata = useCallback(async (f: File): Promise<ParseResult | null> => {
    try {
      const buffer = await f.arrayBuffer()
      const wb = XLSX.read(buffer, { type: 'array' })
      const kpiSheet = wb.Sheets['KPI']
      if (!kpiSheet) return null

      const rows: (string | number | null)[][] = XLSX.utils.sheet_to_json(kpiSheet, {
        header: 1, defval: null,
      })
      const result = parseKpiSheet(rows)
      const scoreSheet = wb.Sheets['score_kpi']
      if (scoreSheet) {
        const scoreRows: (string | number | null)[][] = XLSX.utils.sheet_to_json(scoreSheet, {
          header: 1, defval: null,
        })
        result.actuals = parseScoreKpiSheet(scoreRows)
      }
      return result
    } catch (e) {
      console.error('Parse error:', e)
      return null
    }
  }, [])

  const handleFilesSelection = useCallback(async (files: FileList | null) => {
    if (!files) return
    setMainMessage(null)

    const newFiles: FileWithMetadata[] = []
    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      if (f.name.endsWith('.xlsx')) {
        const result = await parseFileMetadata(f)
        newFiles.push({
          id: Math.random().toString(36).substring(7),
          file: f,
          entityType: 'department',
          deptId: '',
          period: '',
          parseResult: result,
          status: 'pending',
        })
      }
    }
    setFileList(prev => [...prev, ...newFiles])
  }, [parseFileMetadata])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    handleFilesSelection(e.dataTransfer.files)
  }, [handleFilesSelection])

  const updateFileMeta = (id: string, updates: Partial<FileWithMetadata>) => {
    setFileList(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f))
  }

  const removeFile = (id: string) => {
    setFileList(prev => prev.filter(f => f.id !== id))
  }

  async function handleBatchUpload() {
    const pendingFiles = fileList.filter(f => f.status === 'pending')
    if (pendingFiles.length === 0) return

    // Validation
    const invalid = pendingFiles.some(f => !f.deptId || !f.period || (f.parseResult && f.parseResult.validation_errors.length > 0))
    if (invalid) {
      setMainMessage({ type: 'error', text: 'Terdapat file dengan konfigurasi/data yang tidak valid.' })
      return
    }

    setGlobalUploading(true)
    setMainMessage(null)

    // Pre-check for existing data to warn about overwrite
    try {
      const checkRes = await fetch('/api/kpis/check-exists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: pendingFiles.map(f => ({ dept_id: f.deptId, period: f.period })) })
      })
      const checkData = await checkRes.json()

      if (checkRes.ok && checkData.results) {
        const existingEntries = checkData.results.filter((r: any) => r.exists)
        if (existingEntries.length > 0) {
          const names = existingEntries.map((r: any) => {
            const dept = departments.find(d => d.id === r.dept_id)
            return `${dept?.unit_name ?? dept?.name ?? 'Entitas'} (${r.period})`
          }).join('\n• ')

          if (!confirm(`Data untuk entitas & periode berikut sudah ada:\n\n• ${names}\n\nApakah Anda yakin ingin menimpa (overwrite) data tersebut?`)) {
            setGlobalUploading(false)
            return
          }
        }
      }
    } catch (err) {
      console.error('Check exists fail:', err)
    }

    let successCount = 0
    let failCount = 0

    for (const item of pendingFiles) {
      if (!item.parseResult) continue

      updateFileMeta(item.id, { status: 'uploading' })

      try {
        const res = await fetch('/api/kpis/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entity_type: item.entityType,
            dept_id: item.deptId,
            period: item.period,
            kpi_items: item.parseResult.kpi_items,
            actuals: item.parseResult.actuals,
          }),
        })
        const data = await res.json()
        if (res.ok) {
          updateFileMeta(item.id, { status: 'success', message: 'Tersimpan' })
          successCount++
        } else {
          updateFileMeta(item.id, { status: 'error', message: data.error ?? 'Gagal' })
          failCount++
        }
      } catch {
        updateFileMeta(item.id, { status: 'error', message: 'Koneksi Gagal' })
        failCount++
      }
    }

    setGlobalUploading(false)
    if (failCount === 0) {
      setMainMessage({ type: 'success', text: `Berhasil mengunggah ${successCount} file.` })
      setTimeout(() => window.location.reload(), 2000)
    } else {
      setMainMessage({ type: 'error', text: `${failCount} file gagal diunggah.` })
    }
  }

  const selectClassName = "flex h-9 w-full rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors shadow-sm disabled:bg-gray-50 disabled:text-gray-500"

  return (
    <div className="space-y-6">
      {/* Dropzone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer bg-gray-50/50 hover:bg-gray-100/50 hover:border-primary-400 group border-gray-300`}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept=".xlsx"
          multiple
          className="hidden"
          onChange={e => handleFilesSelection(e.target.files)}
        />
        <div className="flex flex-col items-center justify-center text-gray-500">
          <div className="w-14 h-14 bg-white shadow-sm border border-gray-100 rounded-2xl flex items-center justify-center mb-4 text-primary-500 group-hover:scale-110 transition-transform">
            <UploadCloud size={28} />
          </div>
          <p className="font-medium text-gray-700">Drag & drop files <strong className="text-gray-900">.xlsx</strong> di sini, atau klik untuk memilih</p>
          <p className="text-[11px] text-gray-400 mt-1 max-w-sm mx-auto">Mendukung unggahan banyak file sekaligus.</p>
        </div>
      </div>

      {/* File List */}
      {fileList.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <FileSpreadsheet size={16} /> Daftar File ({fileList.length})
            </h3>
            <button
              onClick={() => setFileList([])}
              className="text-xs text-red-500 hover:underline font-medium disabled:opacity-50"
              disabled={globalUploading}
            >
              Hapus Semua
            </button>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
            {fileList.map((item) => {
              const filteredDepts = departments.filter(d =>
                item.entityType === 'corporate' ? d.level === 'L1' :
                  item.entityType === 'department' ? d.level === 'L2' :
                    d.level === 'L3'
              )

              const isError = item.parseResult && item.parseResult.validation_errors.length > 0

              return (
                <div key={item.id} className={`p-4 rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:border-primary-200 ${item.status === 'success' ? 'bg-emerald-50/30' : ''}`}>
                  {/* Row 1: File Info & Actions */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-50">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileSpreadsheet size={18} className="text-primary-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 text-[13px] leading-tight break-words">
                          {item.file.name}
                        </p>
                        <span className="text-[10px] text-gray-400 font-medium">{(item.file.size / 1024).toFixed(1)} KB</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {item.status === 'uploading' && <Loader2 size={18} className="animate-spin text-primary-500" />}
                      {item.status === 'success' && <div className="flex items-center gap-1 text-emerald-600 text-[11px] font-bold bg-emerald-100/50 px-2.5 py-1 rounded-lg"><CheckCircle size={14} /> {item.message}</div>}
                      {item.status === 'error' && <div className="flex items-center gap-1 text-red-600 text-[11px] font-bold bg-red-100/50 px-2.5 py-1 rounded-lg"><AlertTriangle size={14} /> {item.message}</div>}

                      {item.status === 'pending' && (
                        <button
                          onClick={() => removeFile(item.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors bg-gray-50 rounded-lg hover:bg-red-50"
                          title="Hapus file"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Configuration Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight ml-1">Level KPI</label>
                      <select
                        className={selectClassName}
                        value={item.entityType}
                        onChange={e => updateFileMeta(item.id, { entityType: e.target.value as EntityType, deptId: '' })}
                        disabled={item.status === 'success' || item.status === 'uploading'}
                      >
                        <option value="corporate">L1 — Corporate</option>
                        <option value="department">L2 — Department</option>
                        <option value="unit">L3 — Unit</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight ml-1">Entitas</label>
                      <select
                        className={selectClassName}
                        value={item.deptId}
                        onChange={e => updateFileMeta(item.id, { deptId: e.target.value })}
                        disabled={item.status === 'success' || item.status === 'uploading'}
                      >
                        <option value="">— Pilih Entitas —</option>
                        {filteredDepts.map(d => (
                          <option key={d.id} value={d.id}>{d.unit_name ?? d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight ml-1">Periode</label>
                      <MonthPicker
                        value={item.period}
                        onChange={(val: string) => updateFileMeta(item.id, { period: val })}
                        disabled={item.status === 'success' || item.status === 'uploading'}
                      />
                    </div>
                  </div>

                  {/* Row 3: Debug Info / Errors */}
                  <div className="mt-3">
                    {!item.parseResult && <span className="text-[10px] text-red-500 bg-red-50 px-2.5 py-1 rounded-md border border-red-100 inline-flex items-center gap-1 font-semibold"><XCircle size={12} /> Format Sheet Salah (Sheet "KPI" tidak ditemukan)</span>}
                    {isError && (
                      <div className="text-[10px] text-red-600 bg-red-50/50 p-2 rounded-lg border border-red-100/50 space-y-1">
                        <p className="font-bold flex items-center gap-1 opacity-80"><XCircle size={12} /> Terjadi Error pada Data:</p>
                        {item.parseResult?.validation_errors.slice(0, 3).map((err, idx) => (
                          <p key={idx} className="flex items-center gap-1.5 pl-1"><span className="opacity-40">•</span> {err}</p>
                        ))}
                        {item.parseResult && item.parseResult.validation_errors.length > 3 && <p className="ml-3 font-semibold text-red-400 italic">+ {item.parseResult.validation_errors.length - 3} error lainnya...</p>}
                      </div>
                    )}
                    {item.parseResult && !isError && item.parseResult.warnings.length > 0 && (
                      <div className="text-[10px] text-amber-600 bg-amber-50/50 p-2 rounded-lg border border-amber-100/50 flex items-center gap-1.5">
                        <AlertTriangle size={12} className="flex-shrink-0" />
                        <span className="font-medium">{item.parseResult.warnings.length} Peringatan:</span>
                        <span className="truncate opacity-80">{item.parseResult.warnings[0]}</span>
                      </div>
                    )}
                  </div>
                </div>
              )

            })}
          </div>
        </div>
      )}

      {/* Main Submit */}
      {fileList.length > 0 && (
        <div className="flex flex-col gap-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="text-[12px] text-gray-500 flex items-center gap-2">
              <Info size={14} />
              Konfigurasi manual diperlukan untuk setiap file sebelum mengklik Simpan Semua.
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setFileList([])}
                disabled={globalUploading}
              >
                Batal
              </Button>
              <Button
                variant="primary"
                disabled={globalUploading || fileList.every(f => f.status === 'success')}
                onClick={handleBatchUpload}
                className="min-w-[140px]"
              >
                {globalUploading ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    Memproses...
                  </>
                ) : (
                  `Simpan ${fileList.filter(f => f.status === 'pending').length} File`
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Result message */}
      {mainMessage && (
        <div className={`rounded-xl px-5 py-3 text-xs flex items-center gap-2 ${mainMessage.type === 'error'
          ? 'bg-red-50 border border-red-200 text-red-800'
          : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
          }`}>
          {mainMessage.type === 'error' ? <AlertTriangle size={16} className="text-red-500" /> : <CheckCircle size={16} className="text-emerald-500" />}
          {mainMessage.text}
        </div>
      )}
    </div>
  )
}
