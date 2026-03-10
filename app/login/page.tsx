'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { BarChart2, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await signIn('credentials', {
      email, password, redirect: false,
    })

    setLoading(false)
    if (res?.error) {
      setError('Email atau password salah.')
      return
    }
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen w-full flex bg-white font-sans selection:bg-primary-100 selection:text-primary-900">

      {/* Left Area - Form */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center px-8 sm:px-16 md:px-24 relative xl:px-32 animate-fade-in">

        {/* Logo */}
        <div className="absolute top-8 left-8 sm:top-12 sm:left-12 xl:left-24">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-xl shadow-md shadow-primary-500/20 flex items-center justify-center">
              <BarChart2 size={20} className="text-white relative z-10" />
            </div>
            <span className="text-gray-900 font-bold tracking-tight text-lg">KPI System</span>
          </div>
        </div>

        <div className="w-full max-w-sm mt-16 sm:mt-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Selamat Datang</h1>
            <p className="text-gray-500 text-sm">Masuk untuk mengelola metrik dan laporan perusahaan Anda.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 text-sm text-red-600">
              <div className="mt-0.5">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5 border-none">
              <label htmlFor="email" className="block text-[13px] font-medium text-gray-700">Email Perusahaan</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail size={18} className="text-gray-400" />
                </div>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="pl-10 h-11"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5 border-none">
              <label htmlFor="password" className="block text-[13px] font-medium text-gray-700">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2 h-11 relative overflow-hidden group"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Memproses...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Masuk Sistem</span>
                  <ArrowRight size={16} className="transform transition-transform group-hover:translate-x-1" />
                </div>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-[13px] text-gray-500">
            Akses sistem hanya untuk karyawan terautorisasi. Jika Anda memiliki kendala, hubungi <span className="text-primary-600 font-medium">Administrator</span>.
          </p>
        </div>
      </div>

      {/* Right Area - Illustration / Brand Panel */}
      <div className="hidden lg:flex w-[55%] relative overflow-hidden bg-primary-900 border-l border-primary-800">

        {/* Dynamic Background Premium pattern */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-800 via-primary-900 to-[#0A1121] opacity-90"></div>

          <div className="absolute -top-64 -right-64 w-[800px] h-[800px] rounded-full bg-primary-600 opacity-20 blur-3xl animate-float"></div>
          <div className="absolute -bottom-64 -left-32 w-[600px] h-[600px] rounded-full bg-accent opacity-20 blur-3xl animate-float-delayed"></div>

          {/* Subtle grid pattern for enterprise/tech feel */}
          <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CgkJPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0iI2ZmZmZmZiIvPgoJPC9zdmc+')] bg-[length:40px_40px]"></div>
        </div>

        {/* Brand Text Content */}
        <div className="relative z-10 p-16 flex flex-col justify-between h-full w-full">
          <div></div>{/* Spacer */}

          <div className="pl-12 max-w-xl animate-slide-up">
            <div className="inline-flex rounded-full px-3 py-1 bg-white/10 text-white/90 text-xs font-semibold uppercase tracking-wider mb-6 border border-white/10 backdrop-blur-md">
              Powered by Dify & Qwen
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-white leading-[1.15] mb-6">
              Platform Manajemen Kinerja Perusahaan.
            </h2>
            <p className="text-lg text-primary-200 leading-relaxed font-light max-w-md">
              Meningkatkan akurasi analitik, pelaporan BOD otomatis, dan sinkronisasi cerdas menggunakan AI Generatif.
            </p>

            <div className="mt-12 flex items-center gap-6">
              <div className="flex -space-x-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`w-10 h-10 rounded-full border-2 border-primary-900 bg-primary-${i * 200} flex items-center justify-center text-[10px] font-bold text-primary-900`}>
                    U{i}
                  </div>
                ))}
              </div>
              <div className="text-sm font-medium text-white/80">
                100+<span className="text-primary-300 font-normal"> pengguna aktif</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center text-primary-400 text-xs pl-12 mt-12 pb-4">
            <div className="flex items-center gap-4">
              <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
              <span>&bull;</span>
              <span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span>
            </div>
            <span>&copy; {new Date().getFullYear()} KPI System</span>
          </div>
        </div>

      </div>
    </div>
  )
}
