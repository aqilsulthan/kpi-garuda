import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import sql from '@/lib/db'
import { UsersTable } from './UsersTable'
import { User } from '@/types'

import AppShell from '@/components/layout/AppShell'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
    const session = await auth()
    if (session?.user?.role !== 'admin') redirect('/login')

    const usersData = await sql`
    SELECT id, name, email, role, is_active, created_at 
    FROM users 
    ORDER BY created_at DESC
  `

    // Parse date appropriately to avoid Next.js serialization warnings
    const users = usersData.map(u => ({
        ...u,
        created_at: new Date(u.created_at).toISOString()
    })) as User[]

    return (
        <AppShell user={session.user}>
            <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in w-full">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Manajemen Pengguna</h1>
                        <p className="text-gray-500 mt-1">Kelola akses, posisi/role, dan status akun pengguna di KPI System.</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden w-full">
                    <UsersTable initialUsers={users} />
                </div>
            </div>
        </AppShell>
    )
}
