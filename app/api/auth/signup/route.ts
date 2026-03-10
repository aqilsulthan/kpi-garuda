import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import sql from '@/lib/db'
import { z } from 'zod'

const signupSchema = z.object({
    name: z.string().min(2, 'Nama terlalu pendek'),
    email: z.string().email('Format email tidak valid'),
    password: z.string().min(6, 'Password minimal 6 karakter'),
    role: z.enum(['admin', 'corporate_planning', 'direksi'])
})

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { name, email, password, role } = signupSchema.parse(body)

        // Cek apakah email sudah terdaftar
        const existing = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`
        if (existing.length > 0) {
            return NextResponse.json({ error: 'Email sudah terdaftar.' }, { status: 400 })
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, 12)

        // Insert user baru
        await sql`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (${name}, ${email}, ${password_hash}, ${role})
    `

        return NextResponse.json({ ok: true, message: 'Akun berhasil dibuat.' })
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
        }
        console.error('Signup error:', error)
        return NextResponse.json({ error: 'Gagal membuat akun. Terjadi kesalahan internal.' }, { status: 500 })
    }
}
