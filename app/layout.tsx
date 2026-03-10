import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'

export const metadata: Metadata = {
  title: 'KPI Management System',
  description: 'KPI Management System — Powered by Dify Enterprise',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="bg-gray-50/50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 antialiased font-sans selection:bg-primary-100 selection:text-primary-900 overflow-x-hidden">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
