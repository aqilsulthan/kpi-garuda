'use client'
import { useState } from 'react'
import { RefreshCw, CheckCircle, AlertTriangle, Info } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'

interface ExtFields {
  usd_idr: string
  crude_oil: string
  inflation: string
  fuel_price: string
  market_share: string
  notes: string
}

export default function ExternalDataForm() {
  const [period, setPeriod] = useState('')
  const [fields, setFields] = useState<ExtFields>({
    usd_idr: '', crude_oil: '', inflation: '',
    fuel_price: '', market_share: '', notes: '',
  })
  const [fetching, setFetching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [fetchLog, setFetchLog] = useState<string[]>([])

  async function handleAutoFetch() {
    setFetching(true)
    setFetchLog([])
    try {
      const res = await fetch('/api/external-data/fetch')
      const data = await res.json()
      const log: string[] = []

      if (data.usd_idr) {
        setFields(f => ({ ...f, usd_idr: String(data.usd_idr) }))
        log.push(`✅ USD/IDR: ${data.usd_idr.toLocaleString('id-ID')} (Frankfurter API)`)
      }
      if (data.crude_oil) {
        setFields(f => ({ ...f, crude_oil: String(data.crude_oil) }))
        log.push(`✅ Crude Oil: $${data.crude_oil}/bbl (EIA API)`)
      }
      if (data.inflation) {
        setFields(f => ({ ...f, inflation: String(data.inflation) }))
        log.push(`✅ Inflasi: ${data.inflation}% (BPS API)`)
      }
      if (data.errors?.length) {
        data.errors.forEach((e: string) => log.push(`⚠️ ${e}`))
      }
      setFetchLog(log)
    } catch {
      setFetchLog(['❌ Gagal terhubung ke API eksternal.'])
    } finally {
      setFetching(false)
    }
  }

  async function handleSave() {
    if (!period) { setMessage({ type: 'error', text: 'Pilih periode terlebih dahulu.' }); return }
    setSaving(true)
    setMessage(null)

    const entries = [
      { data_type: 'usd_idr', value: fields.usd_idr, unit: 'IDR/USD' },
      { data_type: 'crude_oil', value: fields.crude_oil, unit: 'USD/bbl' },
      { data_type: 'inflation', value: fields.inflation, unit: '%' },
      { data_type: 'fuel_price', value: fields.fuel_price, unit: 'IDR/liter' },
      { data_type: 'market_share', value: fields.market_share, unit: '%' },
    ].filter(e => e.value !== '')

    try {
      const res = await fetch('/api/external-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period, entries, notes: fields.notes }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({ type: 'success', text: `${data.saved} data eksternal berhasil disimpan untuk periode ${period}.` })
      } else {
        setMessage({ type: 'error', text: data.error ?? 'Gagal menyimpan.' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Koneksi ke server gagal.' })
    } finally {
      setSaving(false)
    }
  }

  const inputRow = (label: string, key: keyof ExtFields, placeholder: string, badge?: string) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="flex gap-2 items-center">
        <Input
          placeholder={placeholder}
          value={fields[key]}
          onChange={e => setFields(f => ({ ...f, [key]: e.target.value }))}
        />
        {badge && <Badge variant="default" className="whitespace-nowrap">{badge}</Badge>}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Periode <span className="text-red-500">*</span></label>
          <Input type="month" value={period} onChange={e => setPeriod(e.target.value)} />
        </div>
        <div className="flex items-end">
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2 h-10 border-gray-300 shadow-sm"
            onClick={handleAutoFetch}
            disabled={fetching}
          >
            <RefreshCw size={15} className={fetching ? 'animate-spin text-primary-500' : 'text-gray-500'} />
            {fetching ? 'Mengambil data...' : '🔄 Auto-fetch dari API Rekanan'}
          </Button>
        </div>
      </div>

      {/* Fetch log */}
      {fetchLog.length > 0 && (
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm space-y-1.5 shadow-inner">
          {fetchLog.map((log, i) => <p key={i} className="text-gray-600 flex items-center gap-1.5">{log}</p>)}
        </div>
      )}

      <div className="border-t border-gray-100 pt-5">
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="info">Otomatis</Badge>
          <p className="text-sm font-semibold text-gray-800">
            Data Makroekonomi & Pasar Dunia
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          {inputRow('Kurs USD/IDR', 'usd_idr', '16200', 'IDR/USD')}
          {inputRow('Harga Minyak Dunia', 'crude_oil', '82.4', 'USD/bbl')}
          {inputRow('Inflasi Indonesia', 'inflation', '2.51', '%')}
        </div>

        <div className="flex items-center gap-2 mb-4">
          <Badge variant="warning">Manual</Badge>
          <p className="text-sm font-semibold text-gray-800">
            Data Internal Rekanan & Industri
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {inputRow('Harga Avtur Pertamina', 'fuel_price', '12500', 'IDR/liter')}
          {inputRow('Market Share (%)', 'market_share', '34.5', '%')}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Catatan Konteks Spesifik (opsional)</label>
        <textarea
          className="w-full h-24 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors shadow-sm resize-none"
          placeholder="Berikan catatan tambahan untuk AI, contoh: 'Bulan ini ada libur panjang Lebaran sehingga trafik kargo diprediksi menurun...' "
          value={fields.notes}
          onChange={e => setFields(f => ({ ...f, notes: e.target.value }))}
        />
      </div>

      <div className="flex justify-end pt-2 border-t border-gray-100">
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={saving || !period}
        >
          {saving ? <RefreshCw size={15} className="animate-spin mr-2" /> : <CheckCircle size={15} className="mr-2" />}
          {saving ? 'Menyimpan...' : 'Simpan Data Basis Makro'}
        </Button>
      </div>

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
