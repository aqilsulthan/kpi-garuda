'use client'

import { useState } from 'react'
import { Plus, Edit2, Check, X, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface ExternalData {
    id?: string;
    data_type: string;
    value: string | number;
    unit: string | null;
    notes: string | null;
    source: string;
}

interface Props {
    period: string;
    initialData: ExternalData[];
}

export default function MacroEconomicsWidget({ period, initialData }: Props) {
    const [data, setData] = useState<ExternalData[]>(initialData)
    const [editingRow, setEditingRow] = useState<string | null>(null)

    // States for adding or editing
    const [editValue, setEditValue] = useState('')
    const [editNotes, setEditNotes] = useState('')

    // States for new row
    const [isAdding, setIsAdding] = useState(false)
    const [newType, setNewType] = useState('')
    const [newValue, setNewValue] = useState('')
    const [newUnit, setNewUnit] = useState('')
    const [newNotes, setNewNotes] = useState('')

    const [loading, setLoading] = useState(false)

    const handleSaveEdit = async (dataType: string, unit: string | null) => {
        if (!editValue) return
        setLoading(true)

        try {
            const res = await fetch('/api/integrations/external-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    period,
                    data_type: dataType,
                    value: editValue,
                    unit,
                    notes: editNotes,
                    source: 'manual_override'
                })
            })

            if (res.ok) {
                setData(prev => prev.map(d =>
                    d.data_type === dataType ? { ...d, value: Number(editValue), notes: editNotes, source: 'manual_override' } : d
                ))
                setEditingRow(null)
            } else {
                alert('Gagal menyimpan perubahan.')
            }
        } catch {
            alert('Koneksi terputus.')
        } finally {
            setLoading(false)
        }
    }

    const handleAddNew = async () => {
        if (!newType || !newValue) return
        setLoading(true)

        try {
            const dataTypeKey = newType.toLowerCase().replace(/\s+/g, '_')

            const res = await fetch('/api/integrations/external-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    period,
                    data_type: dataTypeKey,
                    value: newValue,
                    unit: newUnit,
                    notes: newNotes,
                    source: 'manual'
                })
            })

            if (res.ok) {
                setData(prev => {
                    // Check if already exists then replace, else push
                    const exists = prev.find(d => d.data_type === dataTypeKey)
                    if (exists) {
                        return prev.map(d => d.data_type === dataTypeKey ? { ...d, value: Number(newValue), unit: newUnit, notes: newNotes } : d)
                    }
                    return [...prev, { data_type: dataTypeKey, value: Number(newValue), unit: newUnit, notes: newNotes, source: 'manual' }]
                })
                setIsAdding(false)
                setNewType('')
                setNewValue('')
                setNewUnit('')
                setNewNotes('')
            } else {
                alert('Gagal menambahkan data makro.')
            }
        } catch {
            alert('Koneksi terputus.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white border rounded-lg shadow-sm m-4 lg:mx-8 mb-6 animate-fade-in overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50">
                <div>
                    <h3 className="text-sm font-bold text-gray-800">Panel Makro Ekonomi</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Verifikasi harga komoditas atau inflasi yang menjadi baseline periode ini.</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setIsAdding(!isAdding)} disabled={loading}>
                    {isAdding ? <X size={14} className="mr-1.5" /> : <Plus size={14} className="mr-1.5" />}
                    {isAdding ? 'Batal' : 'Tambah Data'}
                </Button>
            </div>

            <div className="p-0 overflow-x-auto">
                <table className="w-full text-[13px] text-left">
                    <thead className="bg-gray-50/90 text-gray-500 font-semibold sticky top-0">
                        <tr>
                            <th className="px-5 py-2.5">Metrik (Data Type)</th>
                            <th className="px-5 py-2.5">Sumber</th>
                            <th className="px-5 py-2.5 w-1/4">Nilai</th>
                            <th className="px-5 py-2.5">Catatan</th>
                            <th className="px-5 py-2.5 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {data.length === 0 && !isAdding && (
                            <tr>
                                <td colSpan={5} className="px-5 py-6 text-center text-gray-400 italic">Belum ada data eksternal tercatat. Tambahkan secara manual.</td>
                            </tr>
                        )}

                        {data.map((item) => (
                            <tr key={item.data_type} className="hover:bg-primary-50/30 transition-colors">
                                <td className="px-5 py-3 font-medium text-gray-800 uppercase text-xs tracking-wider">
                                    {item.data_type.replace(/_/g, ' ')}
                                    <div className="text-[10px] text-gray-400 font-normal mt-0.5">{item.data_type}</div>
                                </td>
                                <td className="px-5 py-3">
                                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${item.source === 'manual_override' ? 'bg-amber-100 text-amber-700' : item.source === 'manual' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                        {item.source}
                                    </span>
                                </td>
                                <td className="px-5 py-3 font-bold text-gray-900">
                                    {editingRow === item.data_type ? (
                                        <div className="flex gap-2">
                                            <Input
                                                className="h-8 max-w-[120px] text-sm font-bold"
                                                value={editValue}
                                                onChange={e => setEditValue(e.target.value)}
                                                placeholder="Nilai angka"
                                                type="number"
                                                disabled={loading}
                                            />
                                            <span className="self-center text-gray-400 font-normal">{item.unit}</span>
                                        </div>
                                    ) : (
                                        <>{Number(item.value).toLocaleString('id-ID')} <span className="text-[11px] text-gray-400 font-normal ml-0.5">{item.unit}</span></>
                                    )}
                                </td>
                                <td className="px-5 py-3 text-gray-600">
                                    {editingRow === item.data_type ? (
                                        <Input
                                            className="h-8 text-sm"
                                            value={editNotes}
                                            onChange={e => setEditNotes(e.target.value)}
                                            placeholder="Notes tambahan"
                                            disabled={loading}
                                        />
                                    ) : (
                                        <span className="block truncate max-w-[200px]" title={item.notes ?? ''}>{item.notes || '-'}</span>
                                    )}
                                </td>
                                <td className="px-5 py-3 text-right">
                                    {editingRow === item.data_type ? (
                                        <div className="flex justify-end gap-1">
                                            <Button size="sm" variant="success" className="h-7 w-7 p-0" onClick={() => handleSaveEdit(item.data_type, item.unit)} disabled={loading || !editValue}>
                                                {loading ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
                                            </Button>
                                            <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-red-500" onClick={() => setEditingRow(null)} disabled={loading}>
                                                <X size={13} />
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]" onClick={() => {
                                            setEditingRow(item.data_type)
                                            setEditValue(String(item.value))
                                            setEditNotes(item.notes || '')
                                        }}>
                                            <Edit2 size={11} className="mr-1.5" /> Override
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))}

                        {isAdding && (
                            <tr className="bg-primary-50/50">
                                <td className="px-5 py-3">
                                    <Input
                                        className="h-8 text-sm"
                                        placeholder="Nama (e.g. Harga Emas)"
                                        value={newType}
                                        onChange={e => setNewType(e.target.value)}
                                        disabled={loading}
                                    />
                                </td>
                                <td className="px-5 py-3">
                                    <span className="inline-flex px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold">manual</span>
                                </td>
                                <td className="px-5 py-3">
                                    <div className="flex gap-2">
                                        <Input
                                            className="h-8 max-w-[100px] text-sm font-bold"
                                            placeholder="Nilai"
                                            type="number"
                                            value={newValue}
                                            onChange={e => setNewValue(e.target.value)}
                                            disabled={loading}
                                        />
                                        <Input
                                            className="h-8 max-w-[80px] text-sm"
                                            placeholder="Unit"
                                            value={newUnit}
                                            onChange={e => setNewUnit(e.target.value)}
                                            disabled={loading}
                                        />
                                    </div>
                                </td>
                                <td className="px-5 py-3">
                                    <Input
                                        className="h-8 text-sm"
                                        placeholder="Catatan tren (opsional)"
                                        value={newNotes}
                                        onChange={e => setNewNotes(e.target.value)}
                                        disabled={loading}
                                    />
                                </td>
                                <td className="px-5 py-3 text-right">
                                    <Button size="sm" variant="primary" className="h-8 px-3" onClick={handleAddNew} disabled={loading || !newType || !newValue}>
                                        {loading ? <RefreshCw size={14} className="animate-spin mr-1.5" /> : <Check size={14} className="mr-1.5" />}
                                        Simpan
                                    </Button>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
