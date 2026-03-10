import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ChatClient from './ChatClient'

export default async function StandaloneChatbotPage() {
    const session = await auth()
    if (!session || session.user?.role !== 'direksi') {
        redirect('/')
    }

    return <ChatClient user={session.user as any} />
}
