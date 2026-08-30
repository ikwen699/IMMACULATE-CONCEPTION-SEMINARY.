import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'
export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const entity = searchParams.get('entity')
    const userId = searchParams.get('userId')

    let query = supabase.from('AuditLog').select('*').order('createdAt', { ascending: false }).limit(100)
    if (action) query = query.ilike('action', `%${action}%`)
    if (entity) query = query.eq('entity', entity)
    if (userId) query = query.eq('userId', userId)

    const { data: logs, error } = await query
    if (error) throw error
    if (!logs) return NextResponse.json([])

    const userIds = [...new Set(logs.map(l => l.userId))]
    const { data: users } = userIds.length > 0
      ? await supabase.from('User').select('id, name, email, role').in('id', userIds)
      : { data: [] }
    const uMap = new Map((users || []).map(u => [u.id, u]))
    const enriched = logs.map(l => ({ ...l, user: uMap.get(l.userId) || null }))

    return NextResponse.json(enriched)
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const role = (session.user as any).role
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const userId = (session.user as any).userId || (session.user as any).id
    const body = await request.json()
    const { action, entity, entityId, oldValues, newValues } = body

    const { data: log, error } = await supabase
      .from('AuditLog')
      .insert({ userId, action, entity, entityId, oldValues, newValues, ipAddress: request.headers.get('x-forwarded-for') || 'unknown' })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(log, { status: 201 })
  } catch (error) {
    console.error('Error creating audit log:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
