import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { roleHome } from '@/lib/role-home'

export default async function Home() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }
  redirect(roleHome((session.user as { role?: string }).role))
}