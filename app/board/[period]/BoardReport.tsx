'use client'
import { useState, useRef } from 'react'
import type { Role } from '@/types'
import { Send, RefreshCw, FileText, Bot, Building2, ChevronLeft, Download } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface Report {
  id: string; dept_id: string; period: string
  ai_content: string; status: string
  published_at: string; dept_name: string
  unit_name: string | null; level: string
}

export default function BoardReport({
  period, reports, userRole,
}: {
  period: string; reports: Report[]; userRole: Role
}) {
  const [selected, setSelected] = useState<Report | null>(reports[0] ?? null)
  const [chatInput, setChatInput] = useState('')
  const [chatLog, setChatLog] = useState<{ role: 'user' | 'ai'; text: string }[]>([])
  const [chatting, setChatting] = useState(false)
  const [convId, setConvId] = useState<string | null>(null)
  const [showMobileList, setShowMobileList] = useState(true)
  const chatEndRef = useRef<HTMLDivElement>(null)

  async function handleChat() {
    if (!chatInput.trim() || !selected) return
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
          context: { published_report: selected.ai_content, dept: selected.dept_name },
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

  if (reports.length === 0) {
    return (
      <div className="flex h-[calc(100vh-2rem)] items-center justify-center m-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="text-center text-gray-400">
          <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
            <FileText size={32} />
          </div>
          <p className="text-xl font-bold text-gray-800">Belum ada laporan</p>
          <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">Tim Corporate Planning belum menerbitkan laporan performa apa pun untuk periode {period}.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-60px)] md:h-[calc(100vh-2rem)] md:m-4 md:mb-0 bg-white md:rounded-t-2xl md:border-t md:border-x border-gray-200/60 shadow-sm overflow-hidden animate-fade-in print:block print:h-auto print:m-0 print:border-none print:shadow-none print:overflow-visible">
      {/* Sidebar laporan */}
      <div className={`w-full md:w-[280px] flex-shrink-0 bg-gray-50/50 border-r border-gray-200/60 flex-col z-10 print:hidden ${showMobileList ? 'flex' : 'hidden md:flex'}`}>
        <div className="p-5 border-b border-gray-200/60 bg-white sticky top-0 z-10">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <Building2 size={16} className="text-amber-500" />
            Laporan Direksi {period}
          </h2>
          <p className="text-[13px] text-gray-500 mt-1">{reports.length} entitas terpublikasi</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {reports.map(r => (
            <button
              key={r.id}
              onClick={() => { setSelected(r); setChatLog([]); setConvId(null); setShowMobileList(false) }}
              className={`w-full text-left p-4 transition-all border-b border-gray-100 ${selected?.id === r.id ? 'bg-white shadow-sm border-l-4 border-l-amber-500 border-r border-r-transparent relative z-20' : 'hover:bg-white'
                }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 pr-3">
                  <p className={`text-[13px] font-semibold truncate ${selected?.id === r.id ? 'text-amber-700' : 'text-gray-700'}`}>
                    {r.unit_name ?? r.dept_name}
                  </p>
                  <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mt-0.5">{r.level}</p>
                </div>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
                ✓ Published
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className={`flex-1 flex flex-col overflow-y-auto lg:overflow-hidden bg-[#F8FAFC] print:block print:h-auto print:overflow-visible print:bg-white ${!showMobileList ? 'flex' : 'hidden md:flex'}`}>
        {selected ? (
          <>
            {/* Header */}
            <div className="px-5 md:px-8 py-4 md:py-6 border-b border-gray-100 bg-white shadow-sm z-10 relative">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <button className="md:hidden p-1 bg-gray-100 rounded hover:bg-gray-200 text-gray-600" onClick={() => setShowMobileList(true)}>
                      <ChevronLeft size={20} />
                    </button>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
                      {selected.unit_name ?? selected.dept_name}
                    </h1>
                  </div>
                  <p className="text-[12px] md:text-sm font-medium text-gray-500 flex items-center gap-2 flex-wrap">
                    <Badge variant="info">Periode {selected.period}</Badge>
                    <span className="text-gray-300 hidden sm:inline">|</span>
                    <span>Dikirim: {selected.published_at ? new Date(selected.published_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</span>
                  </p>
                </div>
                <div>
                  <Button variant="outline" size="sm" onClick={() => window.print()} className="hidden sm:flex shadow-sm print:hidden">
                    <Download size={14} className="mr-2" />
                    Unduh Laporan (PDF)
                  </Button>
                </div>
              </div>
            </div>

            {/* Split view for Document & Chat */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-visible lg:overflow-hidden relative min-h-[500px] lg:min-h-0 print:block print:overflow-visible">

              {/* Report content */}
              <div className="flex-1 overflow-y-auto p-5 md:p-8 relative bg-white lg:border-r border-gray-200/60 shadow-sm md:m-4 lg:my-4 lg:ml-4 lg:mr-0 rounded-none md:rounded-2xl z-10 print:m-0 print:border-none print:shadow-none print:overflow-visible print:w-full">
                <div className="max-w-3xl mx-auto">
                  {selected.ai_content ? (
                    <div className="prose prose-sm md:prose-base prose-gray max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-primary-600">
                      {/* We use dangerouslySetInnerHTML to render HTML from the AI */}
                      <div className="whitespace-pre-wrap text-[15px]" dangerouslySetInnerHTML={{ __html: selected.ai_content }} />
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-400">Konten laporan tidak tersedia.</div>
                  )}
                </div>
              </div>

              {/* Chat with Document */}
              <div className="w-full lg:w-[360px] flex flex-col bg-white border border-gray-200/60 lg:m-4 lg:ml-4 rounded-none md:rounded-2xl overflow-hidden shadow-sm z-10 min-h-[400px] lg:min-h-0 print:hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                    <Bot size={18} className="text-primary-600" /> Executive Assistant
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">Diskusikan isi laporan ini dengan AI.</p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chatLog.length === 0 && (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-xs text-gray-400 text-center italic leading-relaxed px-4">Ketik pertanyaan Anda tentang kinerja departemen ini. AI akan menganalisis dari data historis dan laporan ini.</p>
                    </div>
                  )}
                  {chatLog.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-[13px] leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-primary-600 text-white rounded-br-sm' : 'bg-gray-50 border border-gray-100 text-gray-800 rounded-bl-sm'
                        }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                <div className="p-3 bg-white border-t border-gray-100">
                  <div className="relative">
                    <Input
                      className="pl-4 pr-12 h-11 bg-gray-50 border-gray-200 focus:bg-white text-[13px] rounded-xl"
                      placeholder="Ketikan prompt..."
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleChat()}
                      disabled={chatting}
                    />
                    <button
                      className="absolute inset-y-1.5 right-1.5 px-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center justify-center disabled:opacity-50 transition-colors"
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
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 bg-gray-50/50">
            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-4">
                <Building2 size={24} className="text-gray-300" />
              </div>
              <p className="text-lg font-medium text-gray-700">Pilih Laporan</p>
              <p className="text-sm mt-1">Pilih entitas dari kiri untuk membaca laporannya.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
