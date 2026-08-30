import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

// Ensure dashboard routes are always dynamic (no stale RSC cache)
export const dynamic = 'force-dynamic'

export default async function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) {
    redirect('/login')
  }
  return <>{children}</>
}
