import { auth } from '@/lib/auth'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'

export async function getSession() {
  const session = await auth()
  return session
}

export async function getCurrentUser() {
  const session = await auth()
  if (!session?.user) return null

  const userId = (session.user as any).userId || session.user.id

  const { data: user } = await supabase
    .from('User')
    .select('id, name, email, role, status, phone, address, profileImage, createdAt')
    .eq('id', userId)
    .single()

  if (!user) return null

  let profile: any = {}
  if (user.role === 'STUDENT') {
    const { data: s } = await supabase.from('Student').select('*').eq('userId', userId).single()
    profile.student = s
  } else if (user.role === 'TEACHER') {
    const { data: t } = await supabase.from('Teacher').select('*').eq('userId', userId).single()
    profile.teacher = t
  } else if (user.role === 'PARENT') {
    const { data: p } = await supabase.from('Parent').select('*').eq('userId', userId).single()
    profile.parent = p
  } else if (user.role === 'ACCOUNTANT') {
    const { data: a } = await supabase.from('Accountant').select('*').eq('userId', userId).single()
    profile.accountant = a
  } else if (user.role === 'PRINCIPAL') {
    const { data: p } = await supabase.from('Principal').select('*').eq('userId', userId).single()
    profile.principal = p
  }

  return { ...user, ...profile }
}

export async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    throw new Error('Unauthorized')
  }
  return session
}

export async function requireAdmin() {
  const session = await requireAuth()
  if ((session.user as any).role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }
  return session
}
