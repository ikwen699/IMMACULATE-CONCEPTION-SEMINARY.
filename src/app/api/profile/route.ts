import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any).userId || (session.user as any).id

    const { data: user, error } = await supabase
      .from('User')
      .select('id, name, email, role, status, phone, address, profileImage, createdAt')
      .eq('id', userId)
      .single()

    if (error || !user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    let profile: any = null
    if (user.role === 'STUDENT') {
      const { data: student } = await supabase.from('Student').select('*').eq('userId', userId).single()
      if (student) {
        const { data: cls } = student.classId ? await supabase.from('Class').select('id, name, section').eq('id', student.classId).single() : { data: null }
        let parent = null
        if (student.parentId) {
          const { data: p } = await supabase.from('Parent').select('*').eq('id', student.parentId).single()
          parent = p
        }
        let parentUser = null
        if (parent) {
          const { data: pu } = await supabase.from('User').select('name, email, phone').eq('id', parent.userId).single()
          parentUser = pu
        }
        profile = { ...student, class: cls, parent: parent ? { ...parent, user: parentUser } : null }
      }
    } else if (user.role === 'TEACHER') {
      const { data: t } = await supabase.from('Teacher').select('*').eq('userId', userId).single()
      profile = t
    } else if (user.role === 'PARENT') {
      const { data: p } = await supabase.from('Parent').select('*').eq('userId', userId).single()
      profile = p
    } else if (user.role === 'ACCOUNTANT') {
      const { data: a } = await supabase.from('Accountant').select('*').eq('userId', userId).single()
      profile = a
    } else if (user.role === 'PRINCIPAL') {
      const { data: p } = await supabase.from('Principal').select('*').eq('userId', userId).single()
      profile = p
    }

    const roleKey = user.role.toLowerCase() + (user.role !== 'ADMIN' ? '' : '')
    const result: any = { ...user }
    if (user.role === 'STUDENT') result.student = profile
    else if (user.role === 'TEACHER') result.teacher = profile
    else if (user.role === 'PARENT') result.parent = profile
    else if (user.role === 'ACCOUNTANT') result.accountant = profile
    else if (user.role === 'PRINCIPAL') result.principal = profile

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
