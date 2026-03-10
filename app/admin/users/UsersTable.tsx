'use client'
import { useState } from 'react'
import { User, Role } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { Check, X, Shield, User as UserIcon, Building, Loader2 } from 'lucide-react'

export function UsersTable({ initialUsers }: { initialUsers: User[] }) {
    const [users, setUsers] = useState<User[]>(initialUsers)
    const [loadingId, setLoadingId] = useState<string | null>(null)

    const handleUpdate = async (id: string, updates: { is_active?: boolean, role?: Role }) => {
        setLoadingId(id)
        try {
            const userToUpdate = users.find(u => u.id === id)!
            const newRole = updates.role !== undefined ? updates.role : userToUpdate.role
            const newActive = updates.is_active !== undefined ? updates.is_active : userToUpdate.is_active

            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, role: newRole, is_active: newActive })
            })

            if (res.ok) {
                setUsers(users.map(u => u.id === id ? { ...u, role: newRole, is_active: newActive } : u))
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoadingId(null)
        }
    }

    return (
        <div className="w-full">
            <Table>
                <TableHeader>
                    <TableRow className="bg-gray-50/80">
                        <TableHead>Nama & Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map(user => (
                        <TableRow key={user.id}>
                            <TableCell>
                                <div className="font-medium text-gray-900">{user.name}</div>
                                <div className="text-sm text-gray-500 mt-0.5">{user.email}</div>
                            </TableCell>
                            <TableCell>
                                <select
                                    value={user.role}
                                    onChange={(e) => handleUpdate(user.id, { role: e.target.value as Role })}
                                    disabled={loadingId === user.id}
                                    className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2 transition-colors hover:bg-white"
                                >
                                    <option value="corporate_planning">Corporate Planning</option>
                                    <option value="direksi">Direksi</option>
                                    <option value="admin">Administrator</option>
                                </select>
                            </TableCell>
                            <TableCell>
                                <Badge variant={user.is_active ? 'success' : 'danger'} className="font-medium">
                                    {user.is_active ? 'Aktif' : 'Nonaktif'}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <button
                                    onClick={() => handleUpdate(user.id, { is_active: !user.is_active })}
                                    disabled={loadingId === user.id}
                                    className={`inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${user.is_active
                                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                        : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                        }`}
                                >
                                    {loadingId === user.id ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : user.is_active ? (
                                        <>
                                            <X size={14} className="mr-1.5" /> Suspend
                                        </>
                                    ) : (
                                        <>
                                            <Check size={14} className="mr-1.5" /> Aktifkan
                                        </>
                                    )}
                                </button>
                            </TableCell>
                        </TableRow>
                    ))}
                    {users.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center py-12 text-gray-500">
                                Belum ada pengguna terdaftar.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
