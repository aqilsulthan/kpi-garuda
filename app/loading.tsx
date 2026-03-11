import { RefreshCw } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex-1 w-full h-full min-h-[50vh] flex flex-col items-center justify-center p-8 bg-gray-50/30">
        <RefreshCw size={36} className="text-primary-500 animate-spin mb-4" />
        <h2 className="text-lg font-bold text-gray-800 tracking-tight">Memuat Data...</h2>
        <p className="text-sm text-gray-500 mt-1">Harap tunggu sebentar, sedang menyinkronkan data dengan sistem pusat.</p>
    </div>
  )
}
