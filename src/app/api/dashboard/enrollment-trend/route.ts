import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'
export const dynamic = 'force-dynamic'


export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: students, error } = await supabase
      .from('Student')
      .select('enrollmentDate')

    if (error) throw error

    const now = new Date()
    const months: { month: string; label: string; count: number }[] = []

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({
        month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        count: 0,
      })
    }

    for (const s of students || []) {
      if (!s.enrollmentDate) continue
      const d = new Date(s.enrollmentDate)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const entry = months.find(m => m.month === key)
      if (entry) entry.count++
    }

    return NextResponse.json(months.map(({ month, label, count }) => ({ month: label, count })))
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
