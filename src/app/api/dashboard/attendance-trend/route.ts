import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'
export const dynamic = 'force-dynamic'


export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const start = thirtyDaysAgo.toISOString()

    const { data: records, error } = await supabase
      .from('Attendance')
      .select('date, status')
      .gte('date', start)
      .order('date', { ascending: true })

    if (error) throw error

    const byDate = new Map<string, { total: number; present: number }>()

    for (const r of records || []) {
      const day = new Date(r.date).toISOString().split('T')[0]
      const entry = byDate.get(day) || { total: 0, present: 0 }
      entry.total++
      if (r.status === 'PRESENT' || r.status === 'LATE') entry.present++
      byDate.set(day, entry)
    }

    const result: { date: string; rate: number }[] = []
    const cursor = new Date(thirtyDaysAgo)
    const today = new Date()

    while (cursor <= today) {
      const key = cursor.toISOString().split('T')[0]
      const entry = byDate.get(key)
      result.push({
        date: cursor.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        rate: entry ? Math.round((entry.present / entry.total) * 100) : 0,
      })
      cursor.setDate(cursor.getDate() + 1)
    }

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
