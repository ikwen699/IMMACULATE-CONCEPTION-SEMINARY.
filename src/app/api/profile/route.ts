import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'
export const dynamic = 'force-dynamic'


interface StudentProfile {
  id: string
  admissionNo: string
  classId?: string
  parentId?: string
  user?: { name: string; email: string } | null
  class?: { id: string; name: string; section?: string } | null
  parent?: { id: string; userId: string; name: string; email: string } | null
}

interface TeacherProfile {
  id: string
  subject?: string
  hireDate?: string
}

interface ParentProfile {
  id: string
  userId: string
  name: string
  email: string
}

interface AuthUser {
  id: string
  name: string
  email: string
  role: string
  status: string
  phone?: string
  address?: string
  profileImage?: string
  createdAt: string
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any).userId || (session.user as any).id || session.user.id

    const { data: user, error } = await supabase
      .from('User')
      .select('id, name, email, role, status, phone, address, profileImage, createdAt')
      .eq('id', userId)
      .single()

    if (error || !user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    let profile: StudentProfile | TeacherProfile | ParentProfile | AuthUser | null = null
    if (user.role === 'STUDENT') {
      const { data: student } = await supabase.from('Student').select('*, classId, parentId').eq('userId', userId).single()
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
        profile = { ...student, class: cls, parent: parent ? { ...parent, user: parentUser } : null } as StudentProfile
      }
    } else if (user.role === 'TEACHER') {
      const { data: t } = await supabase.from('Teacher').select('*').eq('userId', userId).single()
      profile = t as TeacherProfile
    } else if (user.role === 'PARENT') {
      const { data: p } = await supabase.from('Parent').select('*').eq('userId', userId).single()
      profile = p as ParentProfile
    } else if (user.role === 'ACCOUNTANT') {
      const { data: a } = await supabase.from('Accountant').select('*').eq('userId', userId).single()
      profile = a as AuthUser
    } else if (user.role === 'PRINCIPAL') {
      const { data: p } = await supabase.from('Principal').select('*').eq('userId', userId).single()
      profile = p as AuthUser
    }

    const result: Record<string, unknown> = { ...user, createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null }
    if (user.role === 'STUDENT') (result as Record<string, unknown>).student = profile
    else if (user.role === 'TEACHER') (result as Record<string, unknown>).teacher = profile
    else if (user.role === 'PARENT') (result as Record<string, unknown>).parent = profile
    else if (user.role === 'ACCOUNTANT') (result as Record<string, unknown>).accountant = profile
    else if (user.role === 'PRINCIPAL') (result as Record<string, unknown>).principal = profile

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
