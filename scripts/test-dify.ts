import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { runKpiAnalyst, sendChatMessage } from '../lib/dify'
import * as fs from 'fs'

async function main() {
  const outputFile = 'test_dify_results.txt'
  fs.writeFileSync(outputFile, '--- TEST DIFY RESULTS ---\n\n')

  const appendToLog = (title: string, data: any) => {
    const text = `===== ${title} =====\n${JSON.stringify(data, null, 2)}\n\n`
    fs.appendFileSync(outputFile, text)
    console.log(`[DONE] ${title}`)
  }

  // Dummy inputs
  const fakeKpiData = [
    {
       "id": "86e5abc7-5a1d-4a15-a3f4-044ceee4c77b",
       "entity_type": "corporate",
       "dept_id": "00000000-0000-0000-0000-000000000001",
       "period": "2025-12",
       "no": 1,
       "objective": "Menjamin standar kelaikan udara dan keselamatan fisik",
       "action_verb": "Safety & Airworthiness Excellence Index",
       "target_from": 90,
       "target_to": 100,
       "parameter": "%",
       "bobot": 0.25,
       "polaritas": "Max",
       "cascaded_from": "",
       "key_drivers": "Integritas suku cadang, kepatuhan audit hangar, dan training SMS.",
       "remarks": "Pilar utama; kegagalan di sini adalah No-Go bagi maskapai.",
       "actual_value": 87.48,
       "ach_rate": 0.8748,
       "score": 0.2187,
       "history": [
          {
             "period": "2025-12",
             "ach_rate": 87.48
          }
       ]
    }
  ]
  const fakeExternalData = [
    {
      "data_type": "crude_oil",
      "metric": "Harga Minyak Mentah (Brent)",
      "source": "api_eia",
      "value": "70.89",
      "unit": "$/BBL",
      "notes": "Ditarik otomatis (Periode Harga EIA: 2026-02)"
    }
  ]
  const fakeContext = {
    "kpi_summary": {
      "id": "1a2b3c",
      "period": "2025-12",
      "dept_name": "Corporate"
    },
    "external_data": fakeExternalData,
    "draft_content": "Draft konten laporan KPI..."
  }

  try {
    // 1. KPI Analyst Workflow
    console.log('Testing KPI Analyst...')
    const workflowRes = await runKpiAnalyst(
      'analyze',
      'Corporate',
      '2025-12',
      fakeKpiData as any,
      fakeExternalData as any,
      'corporate_planning'
    )
    appendToLog('KPI Analyst Workflow (analyze)', workflowRes)

    // 2. Chatflow (KPI Assistant - Corporate Planning)
    console.log('Testing Chatflow (corporate_planning)...')
    const assistantRes = await sendChatMessage(
      'Tolong review draft laporan KPI saya.',
      null,
      'corporate_planning',
      fakeContext
    )
    appendToLog('KPI Assistant Chatflow (corporate_planning)', assistantRes)

    // 3. Executive Agent (BOD Agent - Direksi)
    console.log('Testing Executive Agent (direksi)...')
    const bodRes = await sendChatMessage(
      'Berikan ringkasan eksekutif dan saran tindak lanjut.',
      null,
      'direksi',
      fakeContext
    )
    appendToLog('BOD Executive Agent Chatflow (direksi)', bodRes)

    console.log(`All done! Results saved to ${outputFile}`)
  } catch (err: any) {
    console.error('Test script error:', err)
    appendToLog('ERROR', { error: err.message })
  }
}

main()
