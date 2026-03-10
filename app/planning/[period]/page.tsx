import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { getAllScorecards } from '@/lib/calc'
import { gatherExternalMacroData } from '@/lib/external'
import PlanningWorkspace from './PlanningWorkspace'

interface Props { params: { period: string } }

export default async function PlanningPeriodPage({ params }: Props) {
  const session = await auth()
  if (!session) redirect('/login')

  const { period } = params

  const [scorecards, externalData] = await Promise.all([
    getAllScorecards(period),
    gatherExternalMacroData(period, session.user.id),
  ])

  return (
    <AppShell user={session.user} period={period}>
      <PlanningWorkspace
        period={period}
        scorecards={scorecards}
        externalData={externalData as any}
        userRole={session.user.role}
      />
    </AppShell>
  )
}
