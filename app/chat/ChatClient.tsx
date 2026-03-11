'use client'
import { useState, useRef, useEffect } from 'react'
import { Bot, Send, RefreshCw, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import AppShell from '@/components/layout/AppShell'

interface ChatClientProps {
    user: {
        name: string;
        email: string;
        role: string;
        id: string;
    }
}

export default function ChatClient({ user }: ChatClientProps) {
    const [chatInput, setChatInput] = useState('')
    const [chatLog, setChatLog] = useState<{ role: 'ai' | 'user', text: string }[]>([])
    const [chatting, setChatting] = useState(false)
    const [convId, setConvId] = useState<string | null>(null)
    const chatEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [chatLog])

    useEffect(() => {
        // Load history dari DB
        fetch('/api/chat/history')
            .then(res => res.json())
            .then(data => {
                if (data.messages && data.messages.length > 0) {
                    // Ambil conv_id terakhir
                    const lastMsg = data.messages[data.messages.length - 1]
                    if (lastMsg.conversation_id) {
                        setConvId(lastMsg.conversation_id)
                        
                        // Load semua message dari convId terakhir
                        const currentConvMessages = data.messages
                            .filter((m: any) => m.conversation_id === lastMsg.conversation_id)
                            .map((m: any) => ({
                                role: m.role as 'ai'|'user',
                                text: m.content
                            }))
                        setChatLog(currentConvMessages)
                    }
                }
            })
            .catch(err => console.error("Gagal load history:", err))
    }, [])

    async function handleChat(overrideQuery?: string) {
        const q = overrideQuery || chatInput.trim()
        if (!q || chatting) return

        if (!overrideQuery) setChatInput('')
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
                    role: user.role,
                    context: {
                        general_chat: true,
                        info: 'Konteks percakapan bebas (general query) mengenai keseluruhan KPI Perusahaan.',
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
        }
    }

    const OPENER_PROMPTS = [
        "📊 Berikan ringkasan eksekutif mengenai total kinerja seluruh perusahaan bulan ini.",
        "🚨 Evaluasi dan sebutkan departemen mana saja yang rapor kinerjanya berada di zona merah (<75%).",
        "📈 Bandingkan tren rata-rata skor KPI perusahaan antara bulan terakhir dengan bulan.",
        "🧠 Sebutkan 3 indikator (KPI) dengan skor terendah saat ini, jelaskan asumsinya."
    ]

    return (
        <AppShell user={user as any}>
            <div className="flex flex-col h-[calc(100vh-60px)] md:h-[calc(100vh-2rem)] md:m-4 md:mb-0 bg-white dark:bg-gray-900 md:rounded-t-2xl md:border-t md:border-x border-gray-200/60 dark:border-gray-800 shadow-sm overflow-hidden animate-fade-in">

                {/* Header */}
                <div className="p-5 md:p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between z-10 sticky top-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 rounded-xl flex items-center justify-center">
                            <Bot size={22} />
                        </div>
                        <div>
                            <h1 className="font-bold text-gray-900 dark:text-gray-100 text-lg md:text-xl tracking-tight">Executive Copilot AI</h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Asisten pintar untuk data KPI Perusahaan Anda.</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => { setChatLog([]); setConvId(null) }} className="dark:border-gray-700 dark:text-gray-300">
                        <RefreshCw size={14} className="mr-2" /> Topik Baru (Reset)
                    </Button>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                    {chatLog.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center max-w-4xl mx-auto px-4 space-y-6">
                            <div className="text-center space-y-4 max-w-lg mb-4">
                                <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/20 text-primary-500 mx-auto rounded-3xl flex items-center justify-center">
                                    <MessageSquare size={32} />
                                </div>
                                <div>
                                    <h3 className="text-gray-900 dark:text-white font-bold mb-2 text-xl">Halo, {user.name} 👋</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                        Saya adalah Executive Copilot AI. Anda dapat bertanya mengenai rangkuman kinerja, strategi perusahaan, atau *insight* anomali dari data *Scorecard* secara umum.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full animate-slide-up">
                                {OPENER_PROMPTS.map((prompt, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleChat(prompt)}
                                        disabled={chatting}
                                        className="text-left p-4 rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-primary-200 dark:hover:border-primary-800/50 hover:shadow-sm transition-all text-sm text-gray-700 dark:text-gray-300 disabled:opacity-50 group"
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {chatLog.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'ai' && (
                                <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 flex items-center justify-center flex-shrink-0 mr-3 mt-1">
                                    <Bot size={14} />
                                </div>
                            )}
                            <div className={`px-5 py-3.5 rounded-2xl max-w-[85%] text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                ? 'bg-primary-600 dark:bg-primary-700 text-white rounded-br-sm'
                                : 'bg-white dark:bg-gray-800 border border-gray-200/60 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-sm whitespace-pre-wrap'
                                }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                    <div className="max-w-4xl mx-auto relative flex items-end gap-2 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-400 transition-all">
                        <textarea
                            className="flex-1 bg-transparent border-none outline-none resize-none max-h-[150px] min-h-[44px] p-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 scrollbar-thin"
                            placeholder="Berikan prompt atau pertanyaan seputar data strategis..."
                            value={chatInput}
                            rows={1}
                            onChange={e => {
                                setChatInput(e.target.value)
                                e.target.style.height = 'auto'
                                e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px'
                            }}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleChat()
                                }
                            }}
                            disabled={chatting}
                        />
                        <button
                            className="flex-shrink-0 mb-1 w-10 h-10 bg-primary-600 hover:bg-primary-700 text-white rounded-xl flex items-center justify-center disabled:opacity-50 transition-colors shadow-sm"
                            onClick={() => handleChat()}
                            disabled={chatting || !chatInput.trim()}
                        >
                            {chatting ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
                        </button>
                    </div>
                </div>

            </div>
        </AppShell>
    )
}
