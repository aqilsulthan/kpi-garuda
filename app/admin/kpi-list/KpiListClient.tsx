'use client'
import { useState, useMemo } from 'react'
import { Trash2, AlertTriangle, CheckCircle, Database, FileSpreadsheet, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

interface KpiData {
    period: string
    dept_id: string
    dept_name: string
    unit_name: string | null
    entity_type: string
    kpi_count: number
}

export default function KpiListClient({ initialData }: { initialData: KpiData[] }) {
    const [deleting, setDeleting] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
    const [expandedPeriods, setExpandedPeriods] = useState<Record<string, boolean>>({})

    const togglePeriod = (period: string) => {
        setExpandedPeriods(prev => ({ ...prev, [period]: prev[period] === undefined ? false : !prev[period] }))
    }

    const isExpanded = (period: string) => expandedPeriods[period] !== false

    // Grouping by period
    const dataByPeriod = useMemo(() => {
        const map = new Map<string, KpiData[]>()
        initialData.forEach(d => {
            if (!map.has(d.period)) map.set(d.period, [])
            map.get(d.period)!.push(d)
        })
        return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
    }, [initialData])

    const totalKpiFiles = initialData.length

    const handleDelete = async (period: string, deptId: string, entityType: string) => {
        const isAllDepts = deptId === 'ALL'
        const isAllPeriods = period === 'ALL' 

        let confirmMsg = ''
        if (isAllPeriods) {
            confirmMsg = '⚠️ PERINGATAN KRITIS ⚠️\nApakah Anda yakin ingin MENGHAPUS SEMUA DATA KPI di SEMUA PERIODE? Tindakan ini melenyapkan seluruh data secara permanen.'
        } else if (isAllDepts) {
            confirmMsg = `Apakah Anda yakin ingin menghapus SELURUH DATA KPI pada periode ${period}?`
        } else {
            confirmMsg = `Apakah Anda yakin ingin menghapus data KPI untuk file ini pada periode ${period}?`
        }

        if (!confirm(confirmMsg)) return

        setDeleting(true)
        setMessage(null)

        try {
            const res = await fetch('/api/kpi/period', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ entity_type: entityType, dept_id: deptId, period })
            })

            const data = await res.json()
            if (res.ok) {
                setMessage({ type: 'success', text: `Berhasil dihapus.` })
                setTimeout(() => window.location.reload(), 1000)
            } else {
                setMessage({ type: 'error', text: data.error || 'Gagal menghapus data.' })
                setDeleting(false)
            }
        } catch (e) {
            setMessage({ type: 'error', text: 'Koneksi ke server gagal.' })
            setDeleting(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col mb-4">
                <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center">
                                <Database size={22} />
                            </div>
                            Daftar KPI Terupload
                        </h1>
                        <p className="text-gray-500 text-[15px] mt-2 max-w-2xl">
                            Kelola data KPI yang telah masuk ke sistem. Anda dapat menghapus semua, per periode, atau per file departemen.
                            Total saat ini: {totalKpiFiles} file upload.
                        </p>
                    </div>
                    <div>
                        <Button 
                            variant="danger" 
                            className="bg-red-600 hover:bg-red-700 text-white shadow-sm"
                            disabled={deleting || totalKpiFiles === 0}
                            onClick={() => handleDelete('ALL', 'ALL', 'ALL')}
                        >
                            <Trash2 size={16} className="mr-2" /> Hapus Semua Data (Reset)
                        </Button>
                    </div>
                </div>
            </div>

            {message && (
                <div className={`rounded-xl px-5 py-3.5 text-sm flex items-center gap-2 shadow-sm ${message.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                    }`}>
                    {message.type === 'success' ? <CheckCircle size={18} className="text-emerald-500" /> : <AlertTriangle size={18} className="text-red-500" />}
                    {message.text}
                </div>
            )}

            {dataByPeriod.length === 0 ? (
                <Card className="bg-gray-50/50 border-gray-100 shadow-none">
                    <CardContent className="p-12 text-center text-gray-500">
                        <Database size={48} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium text-gray-700">Tidak ada data KPI</p>
                        <p className="text-sm">Silakan upload data KPI di halaman Setup Ekosistem.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6">
                    {dataByPeriod.map(([period, files]) => (
                        <Card key={period} className="shadow-sm border-gray-200 overflow-hidden">
                            <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                <div 
                                    className="flex items-center gap-3 cursor-pointer select-none hover:opacity-80 transition-opacity"
                                    onClick={() => togglePeriod(period)}
                                >
                                    {isExpanded(period) ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                                    <h2 className="text-lg font-bold text-gray-900">Periode: {period}</h2>
                                    <Badge variant="info">{files.length} File</Badge>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={deleting}
                                    className="text-red-600 hover:bg-red-50 border-red-200"
                                    onClick={() => handleDelete(period, 'ALL', 'ALL')}
                                >
                                    <Trash2 size={14} className="mr-2" /> Hapus Periode Ini
                                </Button>
                            </div>
                            {isExpanded(period) && (
                                <div className="divide-y divide-gray-100 bg-white">
                                    {files.map((file, i) => (
                                    <div key={`${period}-${file.dept_id}-${i}`} className="p-4 px-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <FileSpreadsheet size={18} className="text-primary-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-[15px] font-semibold text-gray-800">
                                                    {file.unit_name || file.dept_name}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                                        {file.entity_type}
                                                    </span>
                                                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                                                    <span className="text-[12px] text-gray-500">
                                                        {file.kpi_count} Indikator KPI
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            disabled={deleting}
                                            onClick={() => handleDelete(period, file.dept_id, file.entity_type)}
                                            className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-200"
                                            title="Hapus file ini"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
