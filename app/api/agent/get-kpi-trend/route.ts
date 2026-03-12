import { NextResponse } from "next/server";
import sql from "@/lib/db";
import { calcAchRate } from "@/lib/calc";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // 1. Validasi API Key Khusus Agent (Security)
  // Untuk mencoba, pastikan Anda menambahkan DIFY_AGENT_SECRET di .env.local
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.DIFY_AGENT_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized. Please set DIFY_AGENT_SECRET in .env.local and send as Bearer token." }, { status: 401 });
  }

  // 2. Ambil parameter dari Dify
  const { searchParams } = new URL(request.url);
  const deptName = searchParams.get("dept_name");
  // Default ambil 24 bulan (2 tahun) jika tidak dispesifikasikan
  const monthsStr = searchParams.get("months") || "24"; 
  const months = parseInt(monthsStr, 10);

  if (!deptName) {
    return NextResponse.json({ error: "Parameter dept_name wajib diisi." }, { status: 400 });
  }

  try {
    // 3. Cari departemen berdasarkan nama (case-insensitive & fuzzy match)
    // misal dify melempar "Marketing"
    const depts = await sql`
      SELECT id, name, unit_name, level 
      FROM departments 
      WHERE name ILIKE ${'%' + deptName + '%'} 
         OR unit_name ILIKE ${'%' + deptName + '%'}
      LIMIT 1
    `;

    if (depts.length === 0) {
      return NextResponse.json({ error: `Departemen dengan nama '${deptName}' tidak ditemukan.` }, { status: 404 });
    }
    const dept = depts[0];

    // 4. Cari data KPI historis
    // Ambil data untuk semua KPI item di departemen tersebut, tapi batasi sejumlah 'months' per action_verb
    // Kita urutkan berdasarkan period desc, limit ke 'months' bulan ke belakang saja per item.
    // Karena periodenya ada banyak, kita group berdasarkan action_verb.
    
    // Tarik semua history untuk departemen ini
    const historyRows = await sql`
      SELECT
        ki.action_verb, 
        ki.period, 
        ki.target_to, 
        ki.target_from,
        ki.polaritas, 
        ka.actual_value,
        ki.bobot
      FROM kpi_items ki
      LEFT JOIN kpi_actuals ka ON ka.kpi_item_id = ki.id AND ka.period = ki.period
      WHERE ki.dept_id = ${dept.id}
      ORDER BY ki.period DESC
    `;

    // 5. Olah data agar formatnya mudah dibaca oleh Agent (LLM)
    // Agregasi per KPI:
    const kpiMap = new Map<string, any[]>();
    
    for (const row of historyRows) {
      if (!kpiMap.has(row.action_verb)) {
        kpiMap.set(row.action_verb, []);
      }
      
      const historyArr = kpiMap.get(row.action_verb)!;
      // Batasi hanya mengambil X bulan ke belakang (sesuai req dari dify)
      if (historyArr.length < months) {
        const actual = row.actual_value !== null ? Number(row.actual_value) : null;
        let achRate = null;
        if (actual !== null && row.target_to !== null) {
            achRate = calcAchRate(actual, Number(row.target_to), row.polaritas);
            // Cap agar AI tidak kaget jika 999%
            if (achRate !== null) achRate = Math.min(achRate * 100, 150);
        }

        historyArr.push({
          period: row.period,
          target_to: Number(row.target_to),
          actual_value: actual,
          ach_rate_percent: achRate ? parseFloat(achRate.toFixed(2)) : null
        });
      }
    }

    // Ubah Map ke Array, lalu sort per period (ASC agar runtut secara kronologis, lebih gampang dicerna LLM)
    const metrics = Array.from(kpiMap.entries()).map(([kpiName, history]) => ({
      kpi_name: kpiName,
      history: history.sort((a, b) => a.period.localeCompare(b.period))
    }));

    // 6. Return response rapih
    return NextResponse.json({
      dept_info: dept,
      months_fetched: months,
      metrics: metrics
    });

  } catch (error) {
    console.error("Error get-kpi-trend:", error);
    return NextResponse.json({ error: "Terjadi kesalahan sistem saat mengambil data tren." }, { status: 500 });
  }
}
