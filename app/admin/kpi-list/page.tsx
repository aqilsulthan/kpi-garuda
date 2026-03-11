import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import KpiListClient from './KpiListClient'
import sql from '@/lib/db'

export default async function AdminKpiListPage() {
  const session = await auth()
  if (!session || session.user.role !== 'admin') redirect('/login')

  const kpiData = await sql`
    SELECT 
      k.period,
      d.id as dept_id,
      d.name as dept_name,
      d.unit_name,
      k.entity_type,
      COUNT(k.id)::int as kpi_count
    FROM kpi_items k
    JOIN departments d ON k.dept_id = d.id
    GROUP BY k.period, d.id, d.name, d.unit_name, k.entity_type
    ORDER BY k.period DESC, d.name ASC
  `

  return (
    <AppShell user={session.user}>
      <div className="p-6 max-w-5xl mx-auto space-y-8 animate-fade-in">
        <KpiListClient initialData={kpiData as any} />
      </div>
    </AppShell>
  )
}
