import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import sql from '@/lib/db'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { BarChart2, ArrowRight, Activity, CalendarDays } from 'lucide-react'

export default async function PlanningIndexPage() {
  const session = await auth()
  if (!session) redirect('/login')

  // Ambil daftar periode yang tersedia
  const periods = await sql`
    SELECT DISTINCT period FROM kpi_items ORDER BY period DESC LIMIT 12
  `

  const currentPeriod = periods[0]?.period ?? null

  const stats = await sql`
    SELECT 
      (SELECT COUNT(DISTINCT period) FROM kpi_items) as total_periods,
      (SELECT COUNT(DISTINCT dept_id) FROM kpi_items WHERE period = (SELECT MAX(period) FROM kpi_items)) as active_depts,
      (SELECT COUNT(*) FROM analysis_drafts) as total_reports
  `

  const overview = stats[0] || { total_periods: 0, active_depts: 0, total_reports: 0 }

  return (
    <AppShell user={session.user}>
      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 animate-fade-in pb-20">

        {/* Premium Hero Section */}
        <div className="relative rounded-3xl bg-gradient-to-br from-primary-900 via-primary-800 to-indigo-900 overflow-hidden shadow-2xl shadow-primary-900/20 text-white p-8 md:p-12">
          <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
            <Activity size={300} strokeWidth={1} />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-6 text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Sistem Perencanaan Terpadu Aktif
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
                Corporate Planning <br className="hidden md:block" /> Workspace
              </h1>
              <p className="text-primary-100/80 text-lg max-w-xl leading-relaxed">
                Pusat kendali analisis indikator kinerja utama. Pantau pergerakan operasional, kerjakan evaluasi bulan berjalan, dan rancang laporan strategis bagi Board of Directors.
              </p>
            </div>

            {currentPeriod && (
              <div className="flex-shrink-0">
                <Link href={`/planning/${currentPeriod}`}>
                  <Button size="lg" className="bg-white text-primary-900 hover:bg-gray-50 h-14 px-8 rounded-2xl shadow-xl shadow-black/10 group transition-all duration-300 hover:scale-[1.02]">
                    <span className="font-bold text-base">Buka Periode {currentPeriod}</span>
                    <ArrowRight size={18} className="ml-3 group-hover:translate-x-1.5 transition-transform" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-md shadow-gray-200/50 bg-white/80 backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6 flex items-center gap-5 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                <CalendarDays size={26} />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{overview.total_periods}</p>
                <p className="text-sm font-medium text-gray-500">Bulan Diunggah</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md shadow-gray-200/50 bg-white/80 backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6 flex items-center gap-5 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <Activity size={26} />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{overview.active_depts}</p>
                <p className="text-sm font-medium text-gray-500">Departemen Aktif Terarsip</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md shadow-gray-200/50 bg-white/80 backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6 flex items-center gap-5 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                <BarChart2 size={26} />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{overview.total_reports}</p>
                <p className="text-sm font-medium text-gray-500">Draft Laporan Dibuat</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {periods.length === 0 ? (
          <Card className="border-dashed border-2 bg-gray-50/50">
            <CardContent className="flex flex-col items-center justify-center p-16 text-center">
              <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-2xl flex items-center justify-center mb-4">
                <BarChart2 size={32} />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Belum ada data KPI</h2>
              <p className="text-gray-500 text-sm max-w-md">Admin perlu mengupload file Excel KPI kinerja bulanan terlebih dahulu agar data dapat dianalisis.</p>
            </CardContent>
          </Card>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <CalendarDays size={18} className="text-gray-400" />
              <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">Semua Periode KPI</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {periods.map(p => (
                <Link
                  key={p.period}
                  href={`/planning/${p.period}`}
                  className="group block"
                >
                  <Card className="h-full transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/10 hover:border-primary-200 border-gray-200/60 cursor-pointer overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardContent className="p-6 relative z-10 flex flex-col justify-between h-full">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-500 group-hover:bg-primary-100 group-hover:text-primary-600 flex items-center justify-center transition-colors">
                          <Activity size={20} />
                        </div>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900 mb-1">{p.period}</p>
                        <p className="text-sm font-medium text-primary-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                          Analisis Laporan <ArrowRight size={14} />
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
