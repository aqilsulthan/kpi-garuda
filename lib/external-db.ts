import sql from './db';

export interface ExternalDataRecord {
    id?: string;
    period: string;
    data_type: string;
    value: number;
    unit: string | null;
    notes: string | null;
    source: string;
    created_by?: string | null;
    created_at?: Date;
}

/**
 * Mengambil semua data eksternal berdasarkan periode tertentu (misal: "2025-12")
 */
export async function getExternalDataByPeriod(period: string): Promise<ExternalDataRecord[]> {
    try {
        const data = await sql<ExternalDataRecord[]>`
      SELECT * FROM external_data
      WHERE period = ${period}
      ORDER BY data_type ASC
    `;
        return data;
    } catch (error) {
        console.error("Gagal mengambil external_data:", error);
        return [];
    }
}

/**
 * Menyimpan atau memperbarui data eksternal hasil tarikan API atau input manual (UPSERT).
 * Kunci uniknya adalah (period, data_type).
 */
export async function upsertExternalData(
    records: Omit<ExternalDataRecord, 'id' | 'created_at'>[]
) {
    if (records.length === 0) return;

    try {
        // Karena kita memakai tabel dari backup.sql yang memiliki UNIQUE(period, data_type) Constraint
        // Kita bisa melakukan insert berantai (batch) dengan on conflict do update.
        await sql`
      INSERT INTO external_data ${sql(records, 'period', 'data_type', 'value', 'unit', 'notes', 'source', 'created_by')}
      ON CONFLICT (period, data_type) 
      DO UPDATE SET 
        value = EXCLUDED.value,
        unit = EXCLUDED.unit,
        notes = EXCLUDED.notes,
        source = EXCLUDED.source,
        created_by = EXCLUDED.created_by
    `;
    } catch (error) {
        console.error("Gagal melakukan upsert external_data:", error);
        throw error;
    }
}

/**
 * Menghapus data spesifik jika manual override perlu dibatalkan
 */
export async function deleteExternalData(period: string, dataType: string) {
    try {
        await sql`
      DELETE FROM external_data
      WHERE period = ${period} AND data_type = ${dataType}
    `;
    } catch (error) {
        console.error("Gagal menghapus external_data:", error);
        throw error;
    }
}
