// lib/dify.ts — Dify Enterprise API Wrapper
import type {
  DifyAction, DifyWorkflowResponse, DifyChatResponse,
  KpiWithActual, ExternalData, Role
} from '@/types'

const getDifyBase = () => process.env.DIFY_BASE_URL! || 'http://localhost'
const getWorkflowKey = () => process.env.DIFY_WORKFLOW_API_KEY!
const getChatflowKey = () => process.env.DIFY_CHATFLOW_API_KEY!
const getExecutiveKey = () => process.env.DIFY_EXECUTIVE_AGENT_API_KEY!

// ─── Workflow: kpi-analyst ────────────────────────────────────
// 3 action dalam 1 workflow: analyze | summarize | suggest
export async function runKpiAnalyst(
  action: DifyAction,
  deptName: string,
  period: string,
  kpiData: KpiWithActual[],
  externalData: ExternalData[],
  userRole: string
): Promise<DifyWorkflowResponse> {
  try {
    const url = `${getDifyBase().replace(/\/v1\/?$/, '')}/v1/workflows/run`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getWorkflowKey()}`,
      },
      body: JSON.stringify({
        inputs: {
          action: action,
          dept_name: deptName,
          period: period,
          kpi_data: JSON.stringify(kpiData),
          external_data: JSON.stringify(externalData),
          role: userRole
        },
        response_mode: 'blocking',
        user: userRole,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return { result: '', error: `Dify Workflow error: ${res.status} — ${err}` }
    }

    const data = await res.json()
    // Dify workflow response: data.data.outputs.result
    const result = data?.data?.outputs?.result ?? data?.data?.outputs?.text ?? ''
    return { result }

  } catch (e) {
    return { result: '', error: `Koneksi ke Dify gagal: ${(e as Error).message}` }
  }
}

// ─── Chatflow: kpi-assistant ──────────────────────────────────
// Satu chatflow untuk semua role — dibedakan via inputs.role + inputs.context
export async function sendChatMessage(
  query: string,
  conversationId: string | null,
  role: Role,
  context: object
): Promise<DifyChatResponse> {
  try {
    // Dify expect specific roles, fallback to corporate_planning if not match.
    const validRoles = ['admin', 'corporate_planning', 'direksi']
    const mappedRole = validRoles.includes(role as string) ? role : 'corporate_planning'

    // Dify Agent Apps require 'streaming' response mode, while standard Chatflows may support 'blocking'.
    const responseMode = mappedRole === 'direksi' ? 'streaming' : 'blocking'

    const deptNameStr = (context as any)?.kpi_summary?.unit_name || (context as any)?.kpi_summary?.dept_name || (context as any)?.dept || 'Corporate'

    // Tambahkan instruksi ketat di belakang query pengguna secara tersembunyi
    const strictInstruction = `\n\n[INSTRUKSI SISTEM: Jawab HANYA berdasarkan data di dalam 'Konteks Data (JSON)'. DILARANG KERAS mengarang angka, entitas, asumsi, atau menggunakan data di luar konteks.]`
    const enhancedQuery = query + strictInstruction

    const body: Record<string, unknown> = {
      query: enhancedQuery,
      inputs: {
        role: mappedRole,
        dept_name: deptNameStr,
        context: JSON.stringify(context),
      },
      response_mode: responseMode,
      user: role,
    }
    if (conversationId) body.conversation_id = conversationId

    // Pilih API Key yang tepat berdasarkan peran
    const apiKey = mappedRole === 'direksi' ? getExecutiveKey() : getChatflowKey()

    const url = `${getDifyBase().replace(/\/v1\/?$/, '')}/v1/chat-messages`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error("Dify API Payload Body:", JSON.stringify(body, null, 2))
      console.error("Dify API Error:", res.status, errText)

      let errMsg = errText
      try {
        const parsed = JSON.parse(errText)
        if (parsed.message) errMsg = parsed.message
      } catch (e) { }

      return {
        answer: `Error dari Dify: ${res.status} - ${errMsg}`,
        conversation_id: conversationId ?? '',
      }
    }

    if (responseMode === 'streaming') {
      const reader = res.body?.getReader()
      const decoder = new TextDecoder('utf-8')
      let fullAnswer = ''
      let finalConvId = conversationId ?? ''

      if (reader) {
        let done = false
        while (!done) {
          const { value, done: readerDone } = await reader.read()
          done = readerDone
          if (value) {
            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n')
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const payload = JSON.parse(line.slice(6))
                  if (payload.event === 'message') {
                    fullAnswer += payload.answer
                  } else if (payload.event === 'agent_message') {
                    fullAnswer += payload.answer
                  }
                  if (payload.conversation_id && !finalConvId) {
                    finalConvId = payload.conversation_id
                  }
                } catch (e) {
                  // silent catch for incomplete JSON chunks
                }
              }
            }
          }
        }
      }
      return {
        answer: fullAnswer || "Menunggu respon dari Agent...",
        conversation_id: finalConvId,
      }
    } else {
      const data = await res.json()
      return {
        answer: data.answer ?? '',
        conversation_id: data.conversation_id ?? '',
      }
    }

  } catch (e) {
    return {
      answer: `Koneksi ke AI gagal: ${(e as Error).message}`,
      conversation_id: conversationId ?? '',
    }
  }
}
