// lib/auth.ts — NextAuth v5 Configuration
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import sql from './db'
import type { Role } from '@/types'

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  pages:   { signIn: '/login' },

  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const [user] = await sql`
          SELECT id, name, email, password_hash, role, is_active
          FROM users
          WHERE email = ${credentials.email as string}
          LIMIT 1
        `
        if (!user || !user.is_active) return null

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password_hash
        )
        if (!valid) return null

        return { id: user.id, name: user.name, email: user.email, role: user.role as Role }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id   = user.id
        token.role = (user as { role: Role }).role
      }
      return token
    },
    async session({ session, token }) {
      session.user.id   = token.id as string
      session.user.role = token.role as Role
      return session
    },
  },
})
