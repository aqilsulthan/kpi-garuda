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

    // Jika ini general chat (dari BOD /chat dashboard):
    // Inject SEMUA level KPI — L1 detail penuh, L2/L3 sebagai summary ringkas.
    // Tujuannya agar BOD bisa menanyakan data departemen & unit tertentu, bukan hanya L1.
    if (context && context.general_chat) {
      let periodParam = body.period || context.period;
      if (!periodParam) {
        const rows = await sql`SELECT MAX(period) as p FROM kpi_items`;
        periodParam = rows[0]?.p;
      }

      if (periodParam) {
        const allScores = await getAllScorecards(periodParam);

        // L1: full detail (sedikit entitas, data lengkap berguna)
        const l1Full = allScores
          .filter(s => s.level === 'L1')
          .map(s => ({
            dept_name: s.dept_name,
            unit_name: s.unit_name,
            level: s.level,
            total_score_pct: s.total_score !== null ? parseFloat((s.total_score * 100).toFixed(2)) : null,
            grade: s.grade,
            kpi_items: s.kpi_items.map(k => ({
              no: k.no,
              name: k.action_verb,
              target_to: k.target_to,
              actual: k.actual_value,
              ach_rate_pct: k.ach_rate !== null ? parseFloat((k.ach_rate * 100).toFixed(1)) : null,
              score_pct: k.score !== null ? parseFloat((k.score * 100).toFixed(2)) : null,
              bobot_pct: parseFloat((k.bobot * 100).toFixed(0)),
            }))
          }));

        // L2 & L3: hanya summary skor (banyak entitas, hemat token, cukup untuk menjawab)
        const l2l3Summary = allScores
          .filter(s => s.level === 'L2' || s.level === 'L3')
          .map(s => ({
            dept_name: s.dept_name,
            unit_name: s.unit_name,
            level: s.level,
            total_score_pct: s.total_score !== null ? parseFloat((s.total_score * 100).toFixed(2)) : null,
            grade: s.grade,
            kpi_count: s.kpi_items.length,
            // Kirim detail KPI per item supaya AI bisa menjawab pertanyaan spesifik
            kpi_items: s.kpi_items.map(k => ({
              no: k.no,
              name: k.action_verb,
              target_to: k.target_to,
              actual: k.actual_value,
              ach_rate_pct: k.ach_rate !== null ? parseFloat((k.ach_rate * 100).toFixed(1)) : null,
              score_pct: k.score !== null ? parseFloat((k.score * 100).toFixed(2)) : null,
              bobot_pct: parseFloat((k.bobot * 100).toFixed(0)),
            }))
          }));

        context.kpi_data = {
          period: periodParam,
          corporate_l1: l1Full,
          departments_and_units: l2l3Summary,
          total_entities: allScores.length,
        };
        context.external_data = await gatherExternalMacroData(periodParam, session.user.id);
        context.info = [
          `Konteks KPI LENGKAP untuk periode ${periodParam} telah disisipkan, mencakup ${allScores.length} entitas (L1 Corporate, L2 Departemen, L3 Unit).`,
          `Gunakan 'corporate_l1' untuk pertanyaan level perusahaan.`,
          `Gunakan 'departments_and_units' untuk pertanyaan per departemen atau unit (Finance, HRD, Quality Assurance, dll).`,
          `JAWAB HANYA berdasarkan data dalam context. Jangan mengarang angka.`
        ].join(' ');
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
