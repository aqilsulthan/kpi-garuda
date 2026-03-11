'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Trash2, AlertTriangle, CheckCircle } from 'lucide-react'
import type { EntityType } from '@/types'

interface Department {
    id: string
    level: string
    name: string
    unit_name: string | null
}

export default function DeleteKpiForm({ departments }: { departments: Department[] }) {
    const [entityType, setEntityType] = useState<EntityType | 'ALL'>('ALL')
    const [deptId, setDeptId] = useState<string>('ALL')
    const [period, setPeriod] = useState<string>('')
    const [deleting, setDeleting] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    const filteredDepts = departments.filter(d =>
        entityType === 'ALL' ? true :
            entityType === 'corporate' ? d.level === 'L1' :
                entityType === 'department' ? d.level === 'L2' :
                    d.level === 'L3'
    )

    const handleDelete = async () => {
        if (!period) return
        const isAll = deptId === 'ALL'
        const confirmMessage = isAll
            ? `Apakah Anda yakin ingin menghapus SELURUH data KPI pada periode ${period} ${entityType === 'ALL' ? 'untuk SEMUA level' : `untuk level ${entityType}`}? Tindakan ini tidak dapat dibatalkan.`
            : `Apakah Anda yakin ingin menghapus data KPI untuk entitas yang dipilih pada periode ${period}? Tindakan ini tidak dapat dibatalkan.`

        if (!confirm(confirmMessage)) return

        setDeleting(true)
        setMessage(null)

        try {
            const res = await fetch('/api/kpis/periods', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ entity_type: entityType, dept_id: deptId, period })
            })

            const data = await res.json()
            if (res.ok) {
                setMessage({ type: 'success', text: `Berhasil menghapus ${data.deletedCount} data KPI pada periode ${period}.` })
                setPeriod('') // reset
            } else {
                setMessage({ type: 'error', text: data.error || 'Gagal menghapus data.' })
            }
        } catch (e) {
            setMessage({ type: 'error', text: 'Koneksi ke server gagal.' })
        } finally {
            setDeleting(false)
        }
    }

    const selectClassName = "flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors shadow-sm disabled:bg-gray-50 disabled:text-gray-500"

    return (
        <div className="space-y-6">
            <div className="bg-red-50/50 p-5 rounded-2xl border border-red-100">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Level KPI</label>
                        <select className={selectClassName} value={entityType} onChange={e => { setEntityType(e.target.value as EntityType | 'ALL'); setDeptId('ALL') }}>
                            <option value="ALL">Semua Level (L1-L3)</option>
                            <option value="corporate">Corporate (L1)</option>
                            <option value="department">Department (L2)</option>
                            <option value="unit">Unit (L3)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Entitas / Departemen
                        </label>
                        <select className={selectClassName} value={deptId} onChange={e => setDeptId(e.target.value)}>
                            <option value="ALL">Semua Entitas pada Level Ini</option>
                            {filteredDepts.map(d => (
                                <option key={d.id} value={d.id}>
                                    {d.unit_name ?? d.name} ({d.level})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Periode (YYYY-MM)</label>
                        <Input
                            type="month"
                            value={period}
                            onChange={e => setPeriod(e.target.value)}
                            className="focus:ring-red-500 h-10"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <Button
                        variant="outline"
                        className="text-red-700 hover:bg-red-100 border-red-200"
                        disabled={!period || deleting}
                        onClick={handleDelete}
                    >
                        <Trash2 size={16} className="mr-2" />
                        {deleting ? 'Menghapus...' : 'Hapus Data KPI'}
                    </Button>
                </div>

                {/* Result message */}
                {message && (
                    <div className={`mt-4 rounded-xl px-5 py-3.5 text-sm flex items-center gap-2 ${message.type === 'success'
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                        : 'bg-red-50 border border-red-200 text-red-800'
                        }`}>
                        {message.type === 'success' ? <CheckCircle size={18} className="text-emerald-500" /> : <AlertTriangle size={18} className="text-red-500" />}
                        {message.text}
                    </div>
                )}
            </div>
        </div>
    )
}
