'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BarChart2, Mail, Lock, Eye, EyeOff, User, ArrowRight, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function SignupPage() {
    const router = useRouter()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [role, setRole] = useState('corporate_planning')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError('')
        setSuccess('')

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role }),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Gagal mendaftar')
                setLoading(false)
                return
            }

            setSuccess('Pendaftaran berhasil! Anda akan diarahkan ke halaman login.')
            setTimeout(() => {
                router.push('/login')
            }, 2000)
        } catch (err) {
            setError('Gangguan koneksi, sistem tidak dapat dijangkau.')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full flex bg-white font-sans selection:bg-primary-100 selection:text-primary-900">

            {/* Left Area - Form */}
            <div className="w-full lg:w-[45%] flex flex-col justify-center px-8 sm:px-16 md:px-24 relative xl:px-32 animate-fade-in py-12">

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
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Buat Akun</h1>
                        <p className="text-gray-500 text-sm">Daftar untuk mulai mengelola metrik dan laporan.</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 text-sm text-red-600">
                            <div className="mt-0.5"><ShieldCheck size={16} /></div>
                            <p className="font-medium">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-3 text-sm text-emerald-600">
                            <div className="mt-0.5"><ShieldCheck size={16} /></div>
                            <p className="font-medium">{success}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5 border-none">
                            <label htmlFor="name" className="block text-[13px] font-medium text-gray-700">Nama Lengkap</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <User size={18} className="text-gray-400" />
                                </div>
                                <Input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="pl-10 h-11 border-gray-200"
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                        </div>

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
                                    className="pl-10 h-11 border-gray-200"
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
                                    className="pl-10 pr-10 h-11 border-gray-200"
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

                        <div className="space-y-1.5 border-none">
                            <label htmlFor="role" className="block text-[13px] font-medium text-gray-700">Posisi / Role</label>
                            <select
                                id="role"
                                value={role}
                                onChange={e => setRole(e.target.value)}
                                className="w-full border border-gray-200 bg-white rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all shadow-sm h-11 cursor-pointer appearance-none"
                                style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
                            >
                                <option value="corporate_planning">Corporate Planning</option>
                                <option value="direksi">Direksi</option>
                                <option value="admin">Administrator</option>
                            </select>
                        </div>

                        <div className="pt-2">
                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                className="w-full h-11 relative overflow-hidden group"
                                disabled={loading}
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2 justify-center w-full">
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Memproses...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 justify-center w-full">
                                        <span>Daftar Sekarang</span>
                                        <ArrowRight size={16} className="transform transition-transform group-hover:translate-x-1" />
                                    </div>
                                )}
                            </Button>
                        </div>
                    </form>

                    <p className="mt-6 text-center text-[13px] text-gray-500">
                        Sudah memiliki akun? <Link href="/login" className="text-primary-600 font-medium hover:underline">Masuk sekarang</Link>
                    </p>
                </div>
            </div>

            {/* Right Area - Custom Signup Illustration */}
            <div className="hidden lg:flex w-[55%] relative overflow-hidden bg-emerald-900 border-l border-emerald-800">

                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-800 via-emerald-900 to-[#0A211D] opacity-90"></div>

                    <div className="absolute -top-64 -right-64 w-[800px] h-[800px] rounded-full bg-emerald-600 opacity-20 blur-3xl animate-float"></div>
                    <div className="absolute -bottom-64 -left-32 w-[600px] h-[600px] rounded-full bg-teal-500 opacity-20 blur-3xl animate-float-delayed"></div>

                    <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CgkJPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0iI2ZmZmZmZiIvPgoJPC9zdmc+')] bg-[length:40px_40px]"></div>
                </div>

                <div className="relative z-10 p-16 flex flex-col justify-between h-full w-full">
                    <div></div>

                    <div className="pl-12 max-w-xl animate-slide-up">
                        <div className="inline-flex rounded-full px-3 py-1 bg-white/10 text-white/90 text-xs font-semibold uppercase tracking-wider mb-6 border border-white/10 backdrop-blur-md">
                            Secure & Encrypted
                        </div>
                        <h2 className="text-4xl lg:text-5xl font-bold text-white leading-[1.15] mb-6">
                            Akses Penuh ke Ruang Kontrol Perusahaan.
                        </h2>
                        <p className="text-lg text-emerald-200 leading-relaxed font-light max-w-md">
                            Mulai gunakan dasbor pintar berbasis AI untuk mempercepat laju pertumbuhan strategi departemen Anda.
                        </p>

                        <div className="mt-12 flex items-center gap-6">
                            <div className="flex -space-x-3">
                                <div className="w-10 h-10 rounded-full border-2 border-emerald-900 bg-emerald-200 flex items-center justify-center text-[10px] font-bold text-emerald-900">1</div>
                                <div className="w-10 h-10 rounded-full border-2 border-emerald-900 bg-emerald-400 flex items-center justify-center text-[10px] font-bold text-emerald-900">2</div>
                                <div className="w-10 h-10 rounded-full border-2 border-emerald-900 bg-emerald-600 flex items-center justify-center text-[10px] font-bold text-emerald-100">3</div>
                            </div>
                            <div className="text-sm font-medium text-white/80">
                                Setup yang <span className="text-emerald-300 font-normal">Cepat & Aman</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center text-emerald-400 text-xs pl-12 mt-12 pb-4">
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
