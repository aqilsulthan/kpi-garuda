import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function Home() {
  const session = await auth()
  if (!session) redirect('/login')

  const role = session.user.role
  if (role === 'admin') redirect('/admin')
  if (role === 'corporate_planning') redirect('/planning')
  if (role === 'direksi') redirect('/board')
  redirect('/login')
}
