// app/api/dify/route.ts — Proxy ke Dify Enterprise
// Menangani workflow (kpi-analyst) dan chatflow (kpi-assistant)
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import sql from '@/lib/db'
import { runKpiAnalyst, sendChatMessage } from '@/lib/dify'
import { gatherExternalMacroData } from '@/lib/external'
import { getAllScorecards } from '@/lib/calc'
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
      freshExternalData as any,
      session.user.role
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

    // Jika ini general chat (dari BOD /chat dashboard), kita suntikkan performa KPI L1 beserta Makro Ekonomi otomatis.
    if (context && context.general_chat) {
      let periodParam = body.period || context.period;
      if (!periodParam) {
        const rows = await sql`SELECT MAX(period) as p FROM kpi_items`;
        periodParam = rows[0]?.p;
      }

      if (periodParam) {
        const allScores = await getAllScorecards(periodParam);
        const l1Scores = allScores.filter(s => s.level === 'L1');

        context.kpi_summary = {
          period: periodParam,
          level: 'Corporate (L1)',
          departments: l1Scores.length > 0 ? l1Scores : 'Tidak ada data L1 ditemukan',
        };
        context.external_data = await gatherExternalMacroData(periodParam, session.user.id);
        context.info = `Data L1 Corporate (seluruh perusahaan) & makro ekonomi untuk periode ${periodParam} telah disisipkan. JANGAN asumsikan data sendiri, JAWAB berdasarkan context JSON.`;
      }
    } else if (context && context.external_data) {
      // Untuk memastikan Chatflow mendapat insight data makro aktual
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

    const finalConvId = result.conversation_id || conversation_id || 'unknown'

    // Simpan history ke database
    try {
      await sql`
        INSERT INTO chat_messages (user_id, role, content, conversation_id)
        VALUES 
          (${session.user.id}, 'user', ${query}, ${finalConvId}),
          (${session.user.id}, 'ai', ${result.answer}, ${finalConvId})
      `
    } catch (dbErr) {
      console.error('Gagal menyimpan chat history:', dbErr)
    }

    return NextResponse.json({
      answer: result.answer,
      conversation_id: finalConvId,
    })
  }

  return NextResponse.json({ error: 'type harus "workflow" atau "chat".' }, { status: 400 })
}
