import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'
import { notifyNewAnnouncement } from '@/lib/notifications'
export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: announcements, error } = await supabase
      .from('Announcement')
      .select('*')
      .eq('isPublished', true)
      .order('createdAt', { ascending: false })

    if (error) throw error
    if (!announcements) return NextResponse.json([])

    const authorIds = [...new Set(announcements.map(a => a.authorId))]
    const { data: authors } = authorIds.length > 0
      ? await supabase.from('User').select('id, name, role').in('id', authorIds)
      : { data: [] }
    const aMap = new Map((authors || []).map(u => [u.id, u]))

    const enriched = announcements.map(a => ({ ...a, author: aMap.get(a.authorId) || null }))
    return NextResponse.json(enriched)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const role = (session.user as any).role
    if (!['ADMIN', 'PRINCIPAL'].includes(role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { title, content, targetRole } = body

    const authorId = (session.user as any).userId || (session.user as any).id || (session.user as any).sub

    const { data: announcement, error } = await supabase
      .from('Announcement')
      .insert({ title, content, authorId, targetRole: targetRole || null })
      .select('*')
      .single()

    if (error) throw error

    const { data: author } = await supabase
      .from('User')
      .select('id, name, role')
      .eq('id', authorId)
      .single()

    notifyNewAnnouncement(announcement.id, title, authorId, targetRole || undefined).catch((err) => {
      console.error('Failed to send announcement notifications:', err)
    })

    return NextResponse.json({ ...announcement, author: author || null }, { status: 201 })
  } catch (error) {
    console.error('Error creating announcement:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const role = (session.user as any).role
    if (!['ADMIN', 'PRINCIPAL'].includes(role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Announcement ID required' }, { status: 400 })

    const { error } = await supabase.from('Announcement').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ message: 'Announcement deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
