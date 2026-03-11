'use client'
import { useState, useRef } from 'react'
import type { DeptScorecard, ExternalData, Role, DifyAction } from '@/types'
import { formatScore } from '@/lib/calc'
import { Send, RefreshCw, CheckCircle, ChevronDown, ChevronUp, Bot, FileText, BarChart2, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import DeptDashboardCharts from '@/components/features/DeptDashboardCharts'
import MacroEconomicsWidget from '@/components/kpi/MacroEconomicsWidget'
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'

interface Props {
  period: string
  scorecards: DeptScorecard[]
  externalData: ExternalData[]
  userRole: Role
}

const GRADE_STYLE = {
  green: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: '🟢', variant: 'success' },
  yellow: { bg: 'bg-amber-100', text: 'text-amber-700', label: '🟡', variant: 'warning' },
  red: { bg: 'bg-red-100', text: 'text-red-700', label: '🔴', variant: 'danger' },
}

const EXT_LABELS: Record<string, { label: string; unit: string }> = {
  usd_idr: { label: 'USD/IDR', unit: '' },
  crude_oil: { label: 'Crude Oil', unit: '/bbl' },
  inflation: { label: 'Inflasi', unit: '%' },
  fuel_price: { label: 'Avtur', unit: '/ltr' },
  market_share: { label: 'Mkt Share', unit: '%' },
}

export default function PlanningWorkspace({ period, scorecards, externalData, userRole }: Props) {
  const [selectedDept, setSelectedDept] = useState<DeptScorecard | null>(
    scorecards[0] ?? null
  )
  const [aiContent, setAiContent] = useState('')
  const [generating, setGenerating] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishMsg, setPublishMsg] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [chatLog, setChatLog] = useState<{ role: 'user' | 'ai'; text: string }[]>([])
  const [chatting, setChatting] = useState(false)
  const [convId, setConvId] = useState<string | null>(null)
  const [expandedKpi, setExpandedKpi] = useState<string | null>(null)
  const [showMobileList, setShowMobileList] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  async function handleDeleteDept(e: React.MouseEvent, sc: DeptScorecard) {
    e.stopPropagation()
    const confirmMessage = `Apakah Anda yakin ingin menghapus data KPI untuk ${sc.unit_name ?? sc.dept_name} pada periode ${period}? Tindakan ini tidak dapat dibatalkan.`
    if (!confirm(confirmMessage)) return

    setDeletingId(sc.dept_id)
    try {
      const res = await fetch('/api/kpi/period', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_type: sc.level === 'L1' ? 'corporate' : sc.level === 'L2' ? 'department' : 'unit',
          dept_id: sc.dept_id,
          period
        })
      })
      if (res.ok) {
        alert('Berhasil dihapus.')
        window.location.reload()
      } else {
        const data = await res.json()
        alert(data.error || 'Gagal menghapus data.')
      }
    } catch {
      alert('Koneksi ke server gagal.')
    } finally {
      if (deletingId === sc.dept_id) setDeletingId(null)
    }
  }

  async function handleGenerate(action: DifyAction) {
    if (!selectedDept) return
    setGenerating(true)
    try {
      const res = await fetch('/api/dify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'workflow',
          action,
          dept_name: selectedDept.dept_name,
          period,
          kpi_data: selectedDept.kpi_items,
          external_data: externalData,
        }),
      })
      const data = await res.json()
      if (data.result) setAiContent(data.result)
      else setAiContent(`❌ ${data.error ?? 'Gagal generate analisis.'}`)
    } catch {
      setAiContent('❌ Koneksi ke Dify gagal.')
    } finally {
      setGenerating(false)
    }
  }

  async function handlePublish() {
    if (!selectedDept || !aiContent) return
    setPublishing(true)
    setPublishMsg('')
    try {
      const res = await fetch('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dept_id: selectedDept.dept_id,
          period,
          entity_type: selectedDept.level === 'L1' ? 'corporate' : selectedDept.level === 'L2' ? 'department' : 'unit',
          ai_content: aiContent,
          action: 'publish',
        }),
      })
      const data = await res.json()
      if (data.ok) {
        setPublishMsg('✅ Laporan berhasil dikirim ke Direksi.')
        setTimeout(() => window.location.reload(), 1500)
      } else {
        setPublishMsg(`❌ ${data.error}`)
      }
    } catch {
      setPublishMsg('❌ Gagal mengirim laporan.')
    } finally {
      setPublishing(false)
    }
  }

  async function handleChat() {
    if (!chatInput.trim() || !selectedDept) return
    const q = chatInput.trim()
    setChatInput('')
    setChatLog(l => [...l, { role: 'user', text: q }])
    setChatting(true)

    try {
      const res = await fetch('/api/dify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'chat',
          query: q,
          conversation_id: convId,
          role: userRole,
          context: {
            kpi_summary: selectedDept,
            external_data: externalData,
            draft_content: aiContent,
          },
        }),
      })
      const data = await res.json()
      setChatLog(l => [...l, { role: 'ai', text: data.answer ?? '...' }])
      if (data.conversation_id) setConvId(data.conversation_id)
    } catch {
      setChatLog(l => [...l, { role: 'ai', text: '❌ Koneksi ke AI gagal.' }])
    } finally {
      setChatting(false)
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }

  const selectedKpis = selectedDept?.kpi_items ?? []

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-60px)] md:h-[calc(100vh-2rem)] md:m-4 md:mb-0 bg-white md:rounded-t-2xl md:border-t md:border-x border-gray-200/60 shadow-sm overflow-hidden animate-fade-in">
      {/* ── LEFT PANEL: Scorecard ── */}
      <div className={`w-full md:w-[300px] flex-shrink-0 bg-gray-50/50 border-r border-gray-200/60 flex-col z-10 ${showMobileList ? 'flex' : 'hidden md:flex'}`}>
        <div className="p-5 border-b border-gray-200/60 bg-white">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <BarChart2 size={16} className="text-primary-500" />
            Scorecard {period}
          </h2>
          <p className="text-[13px] text-gray-500 mt-1">{scorecards.length} departemen/unit terdata</p>
        </div>

        {/* Scorecards list */}
        <div className="flex-1 overflow-y-auto">
          {scorecards.map(sc => {
            const g = sc.grade ? GRADE_STYLE[sc.grade] : null
            const isSelected = selectedDept?.dept_id === sc.dept_id
            return (
              <div
                key={sc.dept_id}
                className={`w-full text-left transition-all border-b border-gray-100 group relative ${isSelected ? 'bg-white shadow-sm border-l-4 border-l-primary-500 border-r border-r-transparent z-20' : 'hover:bg-white'}`}
              >
                <button
                  className="w-full text-left p-4 pb-2 focus:outline-none"
                  onClick={() => { setSelectedDept(sc); setAiContent(''); setChatLog([]); setConvId(null); setShowMobileList(false); }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <p className={`text-[13px] font-semibold truncate ${isSelected ? 'text-primary-700' : 'text-gray-700'}`}>
                          {sc.unit_name ?? sc.dept_name}
                        </p>
                      </div>
                      <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mt-0.5">{sc.level}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {sc.total_score !== null ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${g?.bg} ${g?.text}`}>
                          {(sc.total_score * 100).toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Incomplete</span>
                      )}
                    </div>
                  </div>
                </button>
                <div className="flex justify-between items-center px-4 pb-3 mt-[-4px]">
                  {sc.analysis_status === 'published' && (
                    <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-600">
                      <CheckCircle size={10} /> Published
                    </span>
                  )}
                  {sc.analysis_status === 'draft' && (
                    <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-amber-600">
                      Draft
                    </span>
                  )}
                  {!sc.analysis_status && <span className="w-1"></span> /* spacer */}

                  <button
                    className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:bg-red-50 hover:text-red-600 focus:opacity-100"
                    onClick={(e) => handleDeleteDept(e, sc)}
                    title="Hapus Departemen untuk Periode Ini"
                    disabled={deletingId === sc.dept_id}
                  >
                    {deletingId === sc.dept_id ? (
                      <RefreshCw size={12} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* External data */}
        <div className="border-t border-gray-200/60 p-5 bg-white">
          <p className="text-[11px] font-bold text-gray-400 mb-3 uppercase tracking-wider">Data Eksternal Pasar</p>
          <div className="space-y-2">
            {externalData.length === 0 && (
              <p className="text-xs text-gray-400 italic">Data belum diinput admin.</p>
            )}
            {externalData.map(d => {
              const meta = EXT_LABELS[d.data_type]
              if (!meta) return null
              return (
                <div key={d.id} className="flex justify-between text-[13px] items-center border-b border-gray-50 pb-1 last:border-0 last:pb-0">
                  <span className="text-gray-500 font-medium">{meta.label}</span>
                  <span className="font-bold text-gray-800">
                    {Number(d.value).toLocaleString('id-ID')}<span className="text-[11px] text-gray-400 font-normal ml-0.5">{meta.unit}</span>
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className={`flex-1 flex flex-col bg-white overflow-hidden relative ${!showMobileList ? 'flex' : 'hidden md:flex'}`}>
        {!selectedDept ? (
          <div className="flex-1 flex items-center justify-center bg-gray-50/50">
            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-4">
                <BarChart2 size={24} className="text-gray-300" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Pilih Departemen</h3>
              <p className="text-sm text-gray-500 mt-1">Pilih entitas dari panel kiri untuk melihat data & analisis.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header Data */}
            <div className="px-8 py-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white z-20 shadow-sm relative">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <button className="md:hidden p-1 bg-gray-100 rounded hover:bg-gray-200 text-gray-600" onClick={() => setShowMobileList(true)}>
                    <ChevronDown size={20} className="rotate-90" />
                  </button>
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
                    {selectedDept.unit_name ?? selectedDept.dept_name}
                  </h1>
                  <Badge variant="info" className="uppercase hidden sm:inline-flex">{selectedDept.level}</Badge>
                </div>
                <p className="text-sm text-gray-500 font-medium flex items-center gap-3">
                  <span>{selectedDept.kpi_items.length} Indikator Kinerja</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                  <span>Skor Keseluruhan: <strong className="text-gray-900 ml-1">{selectedDept.total_score !== null ? `${(selectedDept.total_score * 100).toFixed(1)}%` : 'Belum lengkap'}</strong></span>
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => handleGenerate('analyze')} disabled={generating}>
                  {generating ? <RefreshCw size={14} className="animate-spin mr-2" /> : <Bot size={14} className="text-primary-600 mr-2" />} Analisis AI
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleGenerate('summarize')} disabled={generating}>
                  {generating ? <RefreshCw size={14} className="animate-spin mr-2" /> : <FileText size={14} className="text-emerald-600 mr-2" />} Buat Ringkasan
                </Button>
              </div>
            </div>

            {/* --- Insight Dashboard Charts Area --- */}
            <div className="flex-1 overflow-y-auto flex flex-col bg-[#F8FAFC]">

              <MacroEconomicsWidget period={period} initialData={externalData as any[]} />

              <div className="flex-shrink-0 animate-fade-in" style={{ animationDelay: '100ms' }}>
                <DeptDashboardCharts kpis={selectedKpis} />
              </div>

              {/* KPI Top Table - scrollable vertically */}
              <div className="bg-white overflow-y-auto max-h-[250px] border-b border-t border-gray-200/60 shadow-sm z-10 flex-shrink-0">
                <table className="w-full text-[13px] text-left">
                  <thead className="bg-gray-50/90 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-6 py-3 font-semibold text-gray-500 w-12">No</th>
                      <th className="px-6 py-3 font-semibold text-gray-500">Indikator (KPI)</th>
                      <th className="px-6 py-3 font-semibold text-gray-500">Target</th>
                      <th className="px-6 py-3 font-semibold text-gray-500">Aktual</th>
                      <th className="px-6 py-3 font-semibold text-gray-500 text-center">Pencapaian</th>
                      <th className="px-6 py-3 font-semibold text-gray-500 text-center">Tren (6 bln)</th>
                      <th className="px-6 py-3 font-semibold text-gray-500 text-center">Skor Akhir</th>
                      <th className="px-6 py-3 font-semibold text-gray-500 text-right">Bobot</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedKpis.map((kpi, i) => {
                      const score = kpi.score
                      let badgeVar: 'success' | 'warning' | 'danger' | 'default' = 'default'
                      if (score !== null) {
                        if (score >= kpi.bobot * 0.9) badgeVar = 'success'
                        else if (score >= kpi.bobot * 0.75) badgeVar = 'warning'
                        else badgeVar = 'danger'
                      }

                      return (
                        <tr key={kpi.id} className="hover:bg-primary-50/30 transition-colors">
                          <td className="px-6 py-3.5 text-gray-500 font-medium">{kpi.no}</td>
                          <td className="px-6 py-3.5 max-w-[280px]">
                            <p className="font-semibold text-gray-800 line-clamp-2" title={kpi.action_verb}>{kpi.action_verb}</p>
                          </td>
                          <td className="px-6 py-3.5 text-gray-600 font-medium">
                            {kpi.target_to} <span className="text-gray-400 text-[11px] ml-1">{kpi.parameter}</span>
                          </td>
                          <td className="px-6 py-3.5 text-gray-900 font-bold">
                            {kpi.actual_value !== null
                              ? <>{kpi.actual_value} <span className="text-gray-400 font-medium text-[11px] ml-1">{kpi.parameter}</span></>
                              : <span className="text-gray-300 font-normal">—</span>}
                          </td>
                          <td className="px-6 py-3.5 text-center">
                            {kpi.ach_rate !== null ? (
                              <Badge variant={kpi.ach_rate >= 1 ? 'success' : kpi.ach_rate >= 0.8 ? 'warning' : 'danger'}>
                                {(kpi.ach_rate * 100).toFixed(1)}%
                              </Badge>
                            ) : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-6 py-1 text-center">
                            {kpi.history && kpi.history.length > 1 ? (
                              <div className="h-9 w-24 mx-auto cursor-crosshair">
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={kpi.history}>
                                    <Tooltip
                                      contentStyle={{ fontSize: '10px', padding: '2px 4px', borderRadius: '4px', backgroundColor: 'rgba(255, 255, 255, 0.9)', border: 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                                      labelStyle={{ display: 'none' }}
                                      formatter={(val: number) => [`${val.toFixed(0)}%`, 'Ach']}
                                    />
                                    <Line
                                      type="monotone"
                                      dataKey="ach_rate"
                                      stroke={kpi.ach_rate !== null && kpi.ach_rate < 0.75 ? '#ef4444' : '#6366f1'}
                                      strokeWidth={1.5}
                                      dot={false}
                                      activeDot={{ r: 3, fill: '#6366f1', stroke: '#fff' }}
                                    />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            ) : (
                              <span className="text-[10px] text-gray-300 italic">No Data</span>
                            )}
                          </td>
                          <td className="px-6 py-3.5 text-center">
                            {kpi.score !== null ? (
                              <span className={`font-bold ${badgeVar === 'success' ? 'text-emerald-600' : badgeVar === 'warning' ? 'text-amber-600' : 'text-red-600'}`}>
                                {(kpi.score * 100).toFixed(2)}%
                              </span>
                            ) : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-6 py-3.5 text-right font-medium text-gray-400">
                            {(kpi.bobot * 100).toFixed(0)}%
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Workspaces Bottom (Editor & Chat) side-by-side on large screens */}
              <div className="flex flex-col lg:flex-row min-h-[600px] lg:min-h-[500px] flex-shrink-0">

                {/* AI Document Editor */}
                <div className="flex-1 flex flex-col p-4 md:p-6 lg:border-r border-gray-200/60 h-full bg-white/50 relative">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                      <Bot size={18} className="text-primary-500" />
                      Laporan Generator AI
                    </h3>
                    {aiContent && (
                      <Button
                        onClick={handlePublish}
                        disabled={publishing}
                        variant="success"
                        size="sm"
                        className="shadow-sm"
                      >
                        {publishing ? <RefreshCw size={14} className="animate-spin mr-2" /> : <Send size={14} className="mr-2" />}
                        {publishing ? 'Mengirim...' : 'Kirim ke Direksi'}
                      </Button>
                    )}
                  </div>

                  {publishMsg && (
                    <div className={`mb-4 px-4 py-2 rounded-lg text-sm border font-medium ${publishMsg.startsWith('✅') ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                      {publishMsg}
                    </div>
                  )}

                  <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200/60 overflow-hidden relative">
                    {generating && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                        <RefreshCw size={32} className="animate-spin text-primary-500 mb-3" />
                        <p className="font-medium text-primary-900">Menyusun Laporan...</p>
                        <p className="text-xs text-primary-600/70 mt-1">Dify Enterprise Agent sedang bekerja</p>
                      </div>
                    )}
                    {aiContent ? (
                      <div
                        className="w-full h-full p-5 overflow-y-auto outline-none text-sm font-sans leading-relaxed text-gray-700 focus:bg-primary-50/10 transition-colors prose prose-sm max-w-none"
                        contentEditable={!generating}
                        suppressContentEditableWarning={true}
                        onBlur={e => setAiContent(e.currentTarget.innerHTML)}
                        dangerouslySetInnerHTML={{ __html: aiContent }}
                      />
                    ) : (
                      <div className="w-full h-full p-5 text-sm font-sans leading-relaxed text-gray-400 italic">
                        Hasil laporan AI akan tampil di sini. Anda dapat mengedit teks ini secara manual sebelum dikirim ke Direksi...
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Chat Copilot */}
                <div className="w-full lg:w-[350px] flex flex-col bg-white border-t lg:border-t-0 p-4 h-full  overflow-hidden">
                  <div className="mb-4">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                      ✨ Copilot AI
                    </h3>
                    <p className="text-[11px] text-gray-500">Tanyakan insight data atau minta saran strategi.</p>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1 scrollbar-thin">
                    {chatLog.length === 0 && (
                      <div className="h-full flex items-center justify-center text-center px-4">
                        <p className="text-xs text-gray-400 border border-dashed border-gray-200 p-4 rounded-xl">Mulai percakapan untuk me-review draf laporan atau mendapatkan inspirasi.</p>
                      </div>
                    )}
                    {chatLog.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-[13px] leading-relaxed shadow-sm ${msg.role === 'user'
                          ? 'bg-primary-600 text-white rounded-br-sm'
                          : 'bg-gray-50 border border-gray-100 text-gray-700 rounded-bl-sm'
                          }`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {chatting && (
                        <div className="flex justify-start">
                             <div className="px-4 py-2.5 rounded-2xl max-w-[85%] text-[13px] leading-relaxed shadow-sm bg-gray-50 border border-gray-100 text-gray-500 italic rounded-bl-sm flex items-center gap-2">
                                <span className="flex items-center gap-1.5 opacity-70">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                                </span>
                                <span>Memproses jawaban...</span>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  <div className="mt-auto relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Bot size={16} className="text-gray-400" />
                    </div>
                    <Input
                      className="pl-9 pr-12 h-11 bg-gray-50 border-gray-200 focus:bg-white text-[13px]"
                      placeholder="Prompt Copilot..."
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleChat()}
                      disabled={chatting}
                    />
                    <button
                      className="absolute inset-y-1.5 right-1.5 px-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center justify-center disabled:opacity-50 transition-colors"
                      onClick={handleChat}
                      disabled={chatting || !chatInput.trim()}
                    >
                      {chatting ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
