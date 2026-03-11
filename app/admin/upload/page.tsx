import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import UploadExcelForm from './UploadExcelForm'
import ExternalDataForm from './ExternalDataForm'
import DeleteKpiForm from '@/components/features/DeleteKpiForm'
import sql from '@/lib/db'
import { Card, CardContent } from '@/components/ui/Card'
import { Settings, FileSpreadsheet, Globe, Database, ArrowRight } from 'lucide-react'

export default async function AdminUploadPage() {
  const session = await auth()
  if (!session || session.user.role !== 'admin') redirect('/login')

  const departments = await sql`
    SELECT id, level, name, unit_name, head_position
    FROM departments ORDER BY level, name
  `

  return (
    <AppShell user={session.user}>
      <div className="p-6 max-w-5xl mx-auto space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col mb-2">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center">
              <Settings size={22} />
            </div>
            Admin Panel — Setup Ekosistem KPI
          </h1>
          <p className="text-gray-500 text-[15px] mt-2 max-w-2xl">
            Upload file Excel performa KPI unit/departemen, input data eksternal pasar bulanan, dan kelola basis data kecerdasan (Dify).
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="space-y-6">
            {/* Upload Excel */}
            <Card>
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <FileSpreadsheet size={24} className="text-primary-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Upload File Excel KPI</h2>
                    <p className="text-[13px] text-gray-500 mt-1 leading-relaxed">Pilih format Corporate / Department / Unit, lalu unggah file Anda. Pastikan format bulan selaras dengan template.</p>
                  </div>
                </div>
                <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                  <UploadExcelForm departments={departments as any} />
                </div>
              </CardContent>
            </Card>

            {/* Dify KB Link */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100/60 shadow-inner">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-4 flex-col sm:flex-row">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border border-blue-100">
                    <Database size={24} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-blue-900">Knowledge Base Dify</h2>
                    <p className="text-[13px] text-blue-700 mt-1 leading-relaxed">
                      Upload regulasi perusahaan terbaru, data historis, policy eksternal, atau dokumen panduan ke Dify Enterprise.
                    </p>
                    <a
                      // href={`${process.env.NEXT_PUBLIC_DIFY_BASE_URL ?? '#'}/datasets`}
                      href={`${process.env.DIFY_KNOWLEDGE_BASE_URL}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-2 text-[13px] font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl transition-all shadow-sm hover:shadow-blue-500/20 group w-full sm:w-auto justify-center"
                    >
                      Buka Dify Workspace
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* External Data */}
            <Card>
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Globe size={24} className="text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Data Eksternal Bulanan</h2>
                    <p className="text-[13px] text-gray-500 mt-1 leading-relaxed">
                      Kurs nilai tukar mata uang & harga crude oil ditarik otomatis dari API. Avtur & market share dapat diinput manual di bawah.
                    </p>
                  </div>
                </div>
                <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                  <ExternalDataForm />
                </div>
              </CardContent>
            </Card>


          </div>
        </div>
      </div>
    </AppShell>
  )
}
