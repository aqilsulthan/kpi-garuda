'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { BarChart2, Upload, FileText, Home, LogOut, ChevronRight, Database, UserCircle, Menu, X, Activity, MessageSquare } from 'lucide-react'
import type { Role } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { ThemeToggle } from '@/components/ui/theme-toggle'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  roles: Role[]
}

const NAV: NavItem[] = [
  { href: '/admin', label: 'Dashboard System', icon: <Activity size={18} />, roles: ['admin'] },
  { href: '/planning', label: 'Dashboard KPI', icon: <Home size={18} />, roles: ['corporate_planning'] },
  { href: '/admin/upload', label: 'Upload Data', icon: <Upload size={18} />, roles: ['admin'] },
  { href: '/admin/kpi-list', label: 'List Data KPI', icon: <Database size={18} />, roles: ['admin'] },
  { href: '/board', label: 'Laporan BOD', icon: <FileText size={18} />, roles: ['direksi', 'admin'] },
  { href: '/chat', label: 'Chatbot Executive', icon: <MessageSquare size={18} />, roles: ['direksi'] },
  { href: '/admin/users', label: 'Kelola User', icon: <UserCircle size={18} />, roles: ['admin'] },
]

interface Props {
  children: React.ReactNode
  user: { name: string; email: string; role: Role }
  period?: string
}

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrator',
  corporate_planning: 'Corp. Planning',
  direksi: 'Direksi',
}

const ROLE_VARIANTS: Record<Role, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  admin: 'info',
  corporate_planning: 'success',
  direksi: 'warning',
}

export default function AppShell({ children, user, period }: Props) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const visibleNav = NAV.filter(n => n.roles.includes(user.role))

  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-gray-950 overflow-hidden selection:bg-primary-100 dark:selection:bg-primary-900 selection:text-primary-900 dark:selection:text-primary-100 relative print:h-auto print:overflow-visible print:bg-white">
      {/* Mobile Header Menu */}
      <div className="md:hidden absolute top-0 left-0 right-0 h-[60px] bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-5 z-20 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-600 rounded-lg shadow-sm flex items-center justify-center">
            <BarChart2 size={16} className="text-white" />
          </div>
          <p className="text-gray-900 dark:text-white font-bold text-[15px] tracking-tight">KPI System</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 -mr-2 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Overlay Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-gray-900/40 z-30 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Premium styling with white background and subtle shadows */}
      <aside className={`fixed md:static inset-y-0 left-0 w-[260px] bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col flex-shrink-0 z-40 2xl:w-[280px] transition-transform duration-300 ease-in-out print:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        {/* Logo Area */}
        <div className="px-6 py-6 border-b border-gray-50/50 dark:border-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-600 rounded-xl shadow-sm shadow-primary-500/20 flex items-center justify-center">
              <BarChart2 size={18} className="text-white" />
            </div>
            <div>
              <p className="text-gray-900 dark:text-white font-bold text-sm tracking-tight">Smart KPI System</p>
              <p className="text-gray-500 dark:text-gray-400 font-medium text-[11px] tracking-wide">GARUDA INDONESIA</p>
            </div>
          </div>
          <div className="mt-4 flex justify-between items-center">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Theme</span>
            <ThemeToggle />
          </div>
        </div>

        {/* Period indicator */}
        {period && (
          <div className="px-6 py-4 mx-4 mt-6 rounded-2xl bg-primary-50/50 border border-primary-100/50">
            <p className="text-primary-600/70 text-[11px] font-semibold uppercase tracking-wider mb-0.5">Active Period</p>
            <p className="text-primary-900 font-bold text-sm">{period}</p>
          </div>
        )}

        {/* Nav Links */}
        <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto">
          {visibleNav.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${active
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
              >
                <div className={`${active ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors'}`}>
                  {item.icon}
                </div>
                <span>{item.label}</span>
                {active && <ChevronRight size={14} className="ml-auto text-primary-500" />}
              </Link>
            )
          })}
        </nav>

        {/* User Info + Logout Bottom Area */}
        <div className="p-4 m-4 rounded-2xl bg-gray-50/50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center flex-shrink-0">
              <UserCircle size={24} strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-900 dark:text-gray-100 text-sm font-semibold truncate leading-tight">{user.name}</p>
              <p className="text-gray-500 dark:text-gray-400 text-xs truncate mt-0.5">{user.email}</p>
              <div className="mt-2">
                <Badge variant={ROLE_VARIANTS[user.role]}>
                  {ROLE_LABELS[user.role]}
                </Badge>
              </div>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content - add subtle fade-in animation base class */}
      <main className="flex-1 overflow-auto bg-[#F8FAFC] dark:bg-gray-950 pt-[60px] md:pt-0 flex flex-col print:bg-white print:overflow-visible print:pt-0 print:block">
        <div className="h-full print:h-auto print:block animate-fade-in text-gray-900 dark:text-gray-100">
          {children}
        </div>
      </main>
    </div>
  )
}
