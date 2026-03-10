import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import sql from '@/lib/db'
import BoardReport from './BoardReport'

interface Props { params: { period: string } }

export default async function BoardPeriodPage({ params }: Props) {
  const session = await auth()
  if (!session) redirect('/login')

  const { period } = params

  const reports = await sql`
    SELECT
      ad.id, ad.dept_id, ad.period, ad.ai_content, ad.status,
      ad.published_at, ad.updated_at,
      d.name AS dept_name, d.unit_name, d.level
    FROM analysis_drafts ad
    JOIN departments d ON d.id = ad.dept_id
    WHERE ad.period = ${period} AND ad.status = 'published'
    ORDER BY d.level, d.name
  `

  return (
    <AppShell user={session.user} period={period}>
      <BoardReport
        period={period}
        reports={reports as any}
        userRole={session.user.role}
      />
    </AppShell>
  )
}
