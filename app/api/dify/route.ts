// app/api/dify/route.ts — Proxy ke Dify Enterprise
// Menangani workflow (kpi-analyst) dan chatflow (kpi-assistant)
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { runKpiAnalyst, sendChatMessage } from '@/lib/dify'
import { gatherExternalMacroData } from '@/lib/external'
import type { DifyAction, Role } from '@/types'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { type } = body

  // ── Workflow: kpi-analyst ──────────────────────────────────────
  if (type === 'workflow') {
    const { action, dept_name, period, kpi_data, external_data } = body

    if (!action || !dept_name || !period) {
      return NextResponse.json({ error: 'action, dept_name, period wajib diisi.' }, { status: 400 })
    }

    // Selalu ambil data terbaru dari database kita sendiri (Tunggal Sumber Kebenaran)
    // Walaupun frontend mengirim external_data, kita hiraukan dan pakai yang di DB
    const freshExternalData = await gatherExternalMacroData(period, session.user.id)

    const result = await runKpiAnalyst(
      action as DifyAction,
      dept_name,
      period,
      kpi_data ?? [],
      freshExternalData as any
    )

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 502 })
    }
    return NextResponse.json({ result: result.result })
  }

  // ── Chatflow: kpi-assistant ────────────────────────────────────
  if (type === 'chat') {
    const { query, conversation_id, role, context } = body

    if (!query) {
      return NextResponse.json({ error: 'query wajib diisi.' }, { status: 400 })
    }

    // Untuk memastikan Chatflow juga mendapat insight data makro aktual (Jika konteksnya membawa data itu)
    if (context && context.external_data) {
      // Asumsi client sudah kirim nama periode, jika tidak kita skip pembaruan live
      const periodParam = body.period || context.period;
      if (periodParam) {
        context.external_data = await gatherExternalMacroData(periodParam, session.user.id);
      }
    }

    const result = await sendChatMessage(
      query,
      conversation_id ?? null,
      (role ?? session.user.role) as Role,
      context ?? {}
    )

    return NextResponse.json({
      answer: result.answer,
      conversation_id: result.conversation_id,
    })
  }

  return NextResponse.json({ error: 'type harus "workflow" atau "chat".' }, { status: 400 })
}
