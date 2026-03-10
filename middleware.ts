// middleware.ts — Route Protection by Role
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { nextUrl, auth: session } = req
  const path = nextUrl.pathname

  // Public routes
  if (path === '/login' || path === '/signup' || path.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // Not logged in
  if (!session?.user) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const role = session.user.role
  console.log('MIDDLEWARE SESSION:', JSON.stringify(session.user, null, 2))

  // Role-based route protection
  if (path.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL('/unauthorized', req.url))
  }
  if (path.startsWith('/planning') && role !== 'corporate_planning' && role !== 'admin') {
    return NextResponse.redirect(new URL('/unauthorized', req.url))
  }
  if (path.startsWith('/board') && role !== 'direksi' && role !== 'admin') {
    return NextResponse.redirect(new URL('/unauthorized', req.url))
  }

  // API route protection
  if (path.startsWith('/api/') && !path.startsWith('/api/auth')) {
    // Admin-only APIs
    const adminApis = ['/api/parse-excel', '/api/external-data/fetch']
    if (adminApis.some(a => path.startsWith(a)) && role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
}
