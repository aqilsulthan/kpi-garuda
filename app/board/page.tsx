import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import sql from '@/lib/db'
import AppShell from '@/components/layout/AppShell'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FileText, ArrowRight, CheckCircle2, Bookmark } from 'lucide-react'
import BODDashboardCharts from '@/components/features/BODDashboardCharts'
import { getAllScorecards } from '@/lib/calc'

export default async function BoardIndexPage() {
  const session = await auth()
  if (!session) redirect('/login')

  // Ambil periode yang ada laporan published
  const periods = await sql`
    SELECT DISTINCT period FROM analysis_drafts
    WHERE status = 'published'
    ORDER BY period DESC LIMIT 12
  `

  const latest = periods[0]?.period ?? null

  // --- Fetch Trend Data Makro ---
  const trendRows = await sql`
    WITH score_cte AS (
        SELECT 
            ki.period,
            ki.dept_id,
            SUM(
                CASE 
                    WHEN ka.actual_value IS NULL THEN 0
                    WHEN ki.polaritas = 'Max' THEN (ka.actual_value / ki.target_to) * ki.bobot
                    ELSE (ki.target_to / ka.actual_value) * ki.bobot
                END
            ) as total_score
        FROM kpi_items ki
        LEFT JOIN kpi_actuals ka ON ka.kpi_item_id = ki.id AND ka.period = ki.period
        WHERE ki.target_to > 0
        GROUP BY ki.period, ki.dept_id
    )
    SELECT period, AVG(total_score) as score
    FROM score_cte
    GROUP BY period
    ORDER BY period ASC
    LIMIT 12;
  `
  const trendData = trendRows.map(r => ({
    period: r.period,
    score: Number(r.score) || 0
  }))

  // --- Fetch Scorecards for Komparasi & Distribusi Makro ---
  let compareData: any[] = []
  let distributionData: any[] = [
    { name: 'Hijau (≥90%)', value: 0, color: '#10b981' },
    { name: 'Kuning (75-89%)', value: 0, color: '#f59e0b' },
    { name: 'Merah (<75%)', value: 0, color: '#ef4444' }
  ]

  if (latest) {
    const scorecards = await getAllScorecards(latest)

    // Bandingkan tiap Dept/Dir
    compareData = scorecards.map(s => ({
      name: s.unit_name || s.dept_name,
      score: s.total_score || 0,
      level: s.level
    }))

    // Klasifikasi Donut Chart
    scorecards.forEach(s => {
      if (s.grade === 'green') distributionData[0].value += 1
      else if (s.grade === 'yellow') distributionData[1].value += 1
      else if (s.grade === 'red') distributionData[2].value += 1
    })
  }

  return (
    <AppShell user={session.user}>
      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 animate-fade-in pb-20">

        {/* Premium Hero Section */}
        <div className="relative rounded-3xl bg-gradient-to-br from-gray-900 via-slate-800 to-amber-900 overflow-hidden shadow-2xl shadow-slate-900/20 text-white p-8 md:p-12">
          <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4 z-0">
            <FileText size={300} strokeWidth={1} />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 backdrop-blur-md mb-6 text-sm font-medium text-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Laporan Kinerja Tingkat Direksi
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight text-white">
                Board of Directors <br className="hidden md:block" /> Dashboard
              </h1>
              <p className="text-gray-300 text-lg max-w-xl leading-relaxed">
                Akses analitik makro, pantauan skor strategis seluruh perusahaan, dan periksa ringkasan laporan anomali yang dipublikasikan oleh Corporate Planning.
              </p>
            </div>

            {latest && (
              <div className="flex-shrink-0">
                <Link href={`/board/${latest}`}>
                  <Button size="lg" className="bg-amber-500 text-white hover:bg-amber-600 h-14 px-8 rounded-2xl shadow-xl shadow-amber-900/50 group transition-all duration-300 hover:scale-[1.02] border-none">
                    <span className="font-bold text-base">Baca Laporan {latest}</span>
                    <ArrowRight size={18} className="ml-3 group-hover:translate-x-1.5 transition-transform" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* --- Area Grafik Dashboard Direksi --- */}
        {(trendData.length > 0) && (
          <BODDashboardCharts
            trendData={trendData}
            compareData={compareData}
            distributionData={distributionData}
          />
        )}

        {periods.length === 0 ? (
          <Card className="border-dashed border-2 bg-gray-50/50">
            <CardContent className="flex flex-col items-center justify-center p-16 text-center">
              <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-lg flex items-center justify-center mb-4">
                <Bookmark size={32} />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Belum ada laporan yang dipublikasikan</h2>
              <p className="text-gray-500 text-sm max-w-md">Tim Corporate Planning sedang menyiapkan dan mematangkan laporan analisis KPI. Silakan menunggu publikasi selanjutnya.</p>
            </CardContent>
          </Card>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 size={18} className="text-emerald-500" />
              <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">Laporan Yang Telah Diterbitkan</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {periods.map(p => (
                <Link
                  key={p.period}
                  href={`/board/${p.period}`}
                  className="group block"
                >
                  <Card className="h-full transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10 hover:border-amber-200 border-gray-200/60 cursor-pointer overflow-hidden relative">
                    <div className="absolute inset-x-0 top-0 h-1 bg-amber-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                    <CardContent className="p-6 relative z-10 flex flex-col justify-between h-full">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 group-hover:bg-amber-50 group-hover:text-amber-600 flex items-center justify-center transition-colors">
                          <FileText size={20} />
                        </div>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100 uppercase">
                          ✓ Published
                        </span>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900 mb-1">{p.period}</p>
                        <p className="text-sm font-medium text-amber-600 opacity-0 group-hover:opacity-100 flex items-center gap-1 group-hover:gap-2 transition-all transform translate-y-2 group-hover:translate-y-0">
                          baca laporan ringkas <ArrowRight size={14} />
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
