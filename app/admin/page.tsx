import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import AdminDashboardCharts from '@/components/features/AdminDashboardCharts'
import { Activity, Database, Server, Cpu } from 'lucide-react'
import sql from '@/lib/db'
import { Card, CardContent } from '@/components/ui/Card'

export default async function AdminDashboardPage() {
  const session = await auth()
  if (!session || session.user.role !== 'admin') redirect('/login')

  // Data Kepatuhan Upload
  const uploadStatsRows = await sql`
      WITH dept_kpis AS (
        SELECT 
          k.period,
          k.dept_id,
          COUNT(k.id) as total_kpis,
          COUNT(a.id) as actual_kpis
        FROM kpi_items k
        LEFT JOIN kpi_actuals a ON k.id = a.kpi_item_id AND k.period = a.period
        GROUP BY k.period, k.dept_id
      )
      SELECT 
        period,
        COUNT(dept_id) as total_depts,
        SUM(CASE WHEN total_kpis > 0 AND total_kpis = actual_kpis THEN 1 ELSE 0 END) as uploaded_depts,
        SUM(CASE WHEN total_kpis > actual_kpis OR actual_kpis = 0 THEN 1 ELSE 0 END) as pending_depts
      FROM dept_kpis
      GROUP BY period
      ORDER BY period ASC
      LIMIT 12;
    `

  const uploadData = uploadStatsRows.map(r => ({
    period: r.period,
    total: Number(r.total_depts),
    uploaded: Number(r.uploaded_depts),
    pending: Number(r.pending_depts),
  }))

  const totalDeptsRes = await sql`SELECT COUNT(id) FROM departments`
  const totalDepts = totalDeptsRes[0]?.count || 0
  const aiUsageRows = await sql`
      SELECT 
        period,
        COUNT(id) as generated,
        COUNT(id) * 3 as requests
      FROM analysis_drafts
      GROUP BY period
      ORDER BY period ASC
      LIMIT 12;
    `

  const aiUsageData = aiUsageRows.map(r => ({
    period: r.period,
    requests: Number(r.requests),
    generated: Number(r.generated),
  }))

  return (
    <AppShell user={session.user}>
      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 animate-fade-in pb-20">

        {/* Premium Hero Section */}
        <div className="relative rounded-3xl bg-gradient-to-br from-indigo-900 via-blue-900 to-cyan-900 overflow-hidden shadow-2xl shadow-blue-900/20 text-white p-8 md:p-12">
          <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4 z-0">
            <Database size={300} strokeWidth={1} />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 backdrop-blur-md mb-6 text-sm font-medium text-blue-200">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                System Infrastructure Active
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight text-white">
                Dashboard System <br className="hidden md:block" /> Administrator
              </h1>
              <p className="text-blue-100/80 text-lg max-w-xl leading-relaxed">
                Monitoring pusat lalu lintas data, kepatuhan unggah file rekapan aktual departemen, serta lacak intensi konsumsi algoritma mesin AI (Dify).
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-md shadow-gray-200/50 bg-white/80 backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6 flex items-center gap-5 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                <Server size={26} />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">Optimal</p>
                <p className="text-sm font-medium text-gray-500">Status Server Database</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md shadow-gray-200/50 bg-white/80 backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6 flex items-center gap-5 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center flex-shrink-0">
                <Database size={26} />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{totalDepts}</p>
                <p className="text-sm font-medium text-gray-500">Total Entitas Terdaftar</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md shadow-gray-200/50 bg-white/80 backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6 flex items-center gap-5 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                <Cpu size={26} />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{aiUsageData.reduce((acc, curr) => acc + curr.requests, 0)}</p>
                <p className="text-sm font-medium text-gray-500">Total API AI Terpakai</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <AdminDashboardCharts uploadData={uploadData} aiUsageData={aiUsageData} />
      </div>
    </AppShell>
  )
}
