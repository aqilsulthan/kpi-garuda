// app/api/external-data/fetch/route.ts
// Auto-fetch data eksternal dari API resmi gratis:
// - Frankfurter.app → USD/IDR
// - EIA → Crude Oil price
// - BPS → Inflasi Indonesia
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import type { ExternalDataFetchResult } from '@/types'

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const result: ExternalDataFetchResult = { errors: [] }

  // ── 1. USD/IDR — Frankfurter API (gratis, no key) ─────────────
  try {
    const res  = await fetch('https://api.frankfurter.app/latest?from=USD&to=IDR', {
      next: { revalidate: 3600 }
    })
    if (res.ok) {
      const data = await res.json()
      result.usd_idr = data?.rates?.IDR ?? null
    } else {
      result.errors.push('Frankfurter API: gagal mengambil kurs USD/IDR.')
    }
  } catch {
    result.errors.push('Frankfurter API: tidak dapat terhubung.')
  }

  // ── 2. Crude Oil — EIA API (gratis, butuh key) ─────────────────
  const EIA_KEY = process.env.EIA_API_KEY
  if (EIA_KEY) {
    try {
      const url = `https://api.eia.gov/v2/petroleum/pri/spt/data/?api_key=${EIA_KEY}&frequency=weekly&data[0]=value&sort[0][column]=period&sort[0][direction]=desc&length=1`
      const res  = await fetch(url, { next: { revalidate: 3600 } })
      if (res.ok) {
        const data = await res.json()
        result.crude_oil = data?.response?.data?.[0]?.value ?? null
      } else {
        result.errors.push('EIA API: gagal mengambil harga minyak.')
      }
    } catch {
      result.errors.push('EIA API: tidak dapat terhubung.')
    }
  } else {
    result.errors.push('EIA_API_KEY belum diset di .env — harga minyak diisi manual.')
  }

  // ── 3. Inflasi — BPS API (gratis, butuh key) ───────────────────
  // BPS endpoint: https://webapi.bps.go.id/v1/api/list/model/data/...
  // Untuk MVP: bisa diisi manual, BPS API butuh registrasi
  const BPS_KEY = process.env.BPS_API_KEY
  if (BPS_KEY) {
    try {
      // Indikator inflasi BPS: var=1708 (Inflasi umum bulanan)
      const url = `https://webapi.bps.go.id/v1/api/list/model/data/lang/ind/domain/0000/var/1708/key/${BPS_KEY}`
      const res  = await fetch(url, { next: { revalidate: 86400 } })
      if (res.ok) {
        const data = await res.json()
        // Parse nilai terbaru dari struktur BPS
        const datacon = data?.data?.[1]
        if (datacon) {
          const keys    = Object.keys(datacon)
          const lastKey = keys[keys.length - 1]
          const val     = parseFloat(datacon[lastKey])
          if (!isNaN(val)) result.inflation = val
        }
      } else {
        result.errors.push('BPS API: gagal mengambil data inflasi.')
      }
    } catch {
      result.errors.push('BPS API: tidak dapat terhubung.')
    }
  } else {
    result.errors.push('BPS_API_KEY belum diset di .env — inflasi diisi manual.')
  }

  return NextResponse.json(result)
}
