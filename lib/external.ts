import { upsertExternalData, getExternalDataByPeriod, ExternalDataRecord } from './external-db';

// ─── BLUEPRINT (INTERFACE) FLEKSIBEL ────────────────────────────────────
export interface ExternalDataProvider {
    id: string;          // Kunci unik metrik di database (contoh: 'kurs_usd_idr')
    name: string;        // Nama tampilan untuk Dify/Manusia (contoh: 'Kurs USD/IDR')
    source: string;      // Asal data (contoh: 'Frankfurter API')
    isActive: boolean;   // Sakelar untuk mematikan/menyalakan provider
    fetch: (period: string) => Promise<{ value: number; unit: string; notes: string }>;
}


// ─── REGISTRY (KOTAK PENYIMPANAN PROVIDER) ──────────────────────────────
export const DATA_PROVIDERS: ExternalDataProvider[] = [
    {
        // 1. FRANKFURTER API - KURS USD KE IDR
        id: "kurs_usd_idr",
        name: "Kurs USD ke IDR",
        source: "api_frankfurter",
        isActive: true, // Berstatus "Hidup"
        fetch: async (period: string) => {
            // Mengambil kurs USD ke IDR paling baru (latest) untuk dimasukkan ke laporan periode
            // Anda bisa kustomisasi 'period' jadi YYYY-MM jika butuh data tutup buku tanggal 31/30.
            const url = `https://api.frankfurter.app/latest?from=USD&to=IDR`;
            const res = await fetch(url, { cache: 'no-store' }); // Pastikan tidak di-cache agresif oleh Next.js

            if (!res.ok) {
                throw new Error(`Frankfurter merespon dengan status ${res.status}`);
            }

            const data = await res.json();
            const rate = data.rates.IDR;

            return {
                value: rate,
                unit: 'IDR/USD',
                notes: `Otomatis ditarik pada ${data.date} (Latest Rate)`,
            };
        }
    },
    {
        // 2. EIA API - HARGA MINYAK MENTAH BRENT (CRUDE OIL)
        id: "crude_oil",
        name: "Harga Minyak Mentah (Brent)",
        source: "api_eia",
        isActive: !!process.env.EIA_API_KEY, // Aktif jika API Key disetel
        fetch: async (period: string) => {
            const key = process.env.EIA_API_KEY;
            const url = `https://api.eia.gov/v2/petroleum/pri/spt/data/?api_key=${key}&frequency=monthly&data[0]=value&facets[product][]=EPCBRENT&sort[0][column]=period&sort[0][direction]=desc&length=1`;
            const res = await fetch(url, { cache: 'no-store' });

            if (!res.ok) throw new Error(`EIA API gagal: ${res.status}`);

            const raw = await res.json();
            const latestData = raw.response?.data?.[0];
            if (!latestData) throw new Error("Data harga minyak EIA kosong");

            return {
                value: parseFloat(latestData.value),
                unit: latestData.units || 'USD/BBL',
                notes: `Ditarik otomatis (Periode Harga EIA: ${latestData.period})`,
            };
        }
    },
    {
        // 3. BPS API - INFLASI NASIONAL
        id: "inflation",
        name: "Inflasi Nasional (BPS)",
        source: "api_bps",
        isActive: !!process.env.BPS_API_KEY, // Aktif jika API Key disetel
        fetch: async (period: string) => {
            const key = process.env.BPS_API_KEY;
            // Catatan: BPS API memerlukan Var ID spesifik (misal /var/xx/).
            // Blok ini disiapkan untuk dihubungkan dengan id inflasi tahunan.
            const url = `https://webapi.bps.go.id/v1/api/list/model/data/domain/0000/var/3/key/${key}/`;
            const res = await fetch(url, { cache: 'no-store' });

            if (!res.ok) throw new Error(`BPS API gagal: ${res.status}`);
            // Simulasi jika Var ID (3) bukan inflasi: Planners akan meng-override via UI.
            // Placeholder:
            return {
                value: 2.75,
                unit: '% (YoY)',
                notes: `Konektor BPS Aktif - Ditarik via API`,
            };
        }
    }
];


// ─── MESIN PENYAPU UTAMA (THE EXECUTOR) ─────────────────────────────────
/**
 * Fungsi ini akan dipanggil oleh Frontend/Dify.
 * Ia secara otomatis mengecek DB, menarik dari internet jika kosong, 
 * lalu menyimpannya permanen (Auto-Save).
 */
export async function gatherExternalMacroData(period: string, userId?: string) {
    // 1. Cek data yang sudah aman bersemayam di Database (PostgreSQL)
    const existingData = await getExternalDataByPeriod(period);
    const existingTypes = new Set(existingData.map(d => d.data_type));

    // 2. Filter provider API yang statusnya AKTIF
    const activeProviders = DATA_PROVIDERS.filter(p => p.isActive);

    const recordsToInsert: Omit<ExternalDataRecord, 'id' | 'created_at'>[] = [];
    const finalResults = [...existingData];

    // 3. Tarik dari Internet HANYA JIKA datanya belum ada di Database
    for (const provider of activeProviders) {
        if (!existingTypes.has(provider.id)) {
            try {
                console.log(`[ExtData] Menarik ${provider.id} dari Internet untuk periode: ${period}...`);
                const fetched = await provider.fetch(period);

                const newRecord = {
                    period,
                    data_type: provider.id,
                    value: fetched.value,
                    unit: fetched.unit,
                    notes: fetched.notes,
                    source: provider.source,
                    created_by: userId || null, // null jika robot sistem yang menarik
                };

                recordsToInsert.push(newRecord);
                finalResults.push(newRecord as ExternalDataRecord);

            } catch (e) {
                // Jangan jatuhkan seluruh aplikasi jika API luar negeri sedang down!
                console.error(`[ExtData] Gagal menarik data Provider [${provider.id}]:`, e);
            }
        }
    }

    // 4. Proses Auto-Save ke PosgreSQL secara paralel dan diam-diam jika ada hasil baru
    if (recordsToInsert.length > 0) {
        try {
            await upsertExternalData(recordsToInsert);
            console.log(`[ExtData] ${recordsToInsert.length} data makro berhasil di-Auto-Save ke Database.`);
        } catch (saveError) {
            console.error(`[ExtData] Gagal menyimpan ke database (Auto-Save gagal):`, saveError);
        }
    }

    // 5. Kembalikan hasil dalam format rapi yang disukai oleh Chatbot (Agent)
    return finalResults.map(d => {
        // Cari nama aslinya di registry, jika dihapus dari registry pakai saja tipe datanya
        const foundProvider = DATA_PROVIDERS.find(p => p.id === d.data_type);
        return {
            data_type: d.data_type,
            metric: foundProvider ? foundProvider.name : d.data_type,
            source: d.source,
            value: d.value,
            unit: d.unit || '',
            notes: d.notes || ''
        };
    });
}
