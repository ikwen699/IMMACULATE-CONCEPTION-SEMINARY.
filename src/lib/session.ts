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

  const { data: user, error: userError } = await supabase
    .from('User')
    .select('id, name, email, role, status, phone, address, profileImage, createdAt')
    .eq('id', userId)
    .single()

  if (userError) {
    console.error('Database error fetching user:', userError)
    return null
  }

  if (!user) return null

  let profile: any = {}
  if (user.role === 'STUDENT') {
    const { data: s, error: sErr } = await supabase.from('Student').select('*').eq('userId', userId).single()
    if (sErr) {
      console.error('Database error fetching student profile:', sErr)
      profile.student = null
    } else {
      profile.student = s
    }
  } else if (user.role === 'TEACHER') {
    const { data: t, error: tErr } = await supabase.from('Teacher').select('*').eq('userId', userId).single()
    if (tErr) {
      console.error('Database error fetching teacher profile:', tErr)
      profile.teacher = null
    } else {
      profile.teacher = t
    }
  } else if (user.role === 'PARENT') {
    const { data: p, error: pErr } = await supabase.from('Parent').select('*').eq('userId', userId).single()
    if (pErr) {
      console.error('Database error fetching parent profile:', pErr)
      profile.parent = null
    } else {
      profile.parent = p
    }
  } else if (user.role === 'ACCOUNTANT') {
    const { data: a, error: aErr } = await supabase.from('Accountant').select('*').eq('userId', userId).single()
    if (aErr) {
      console.error('Database error fetching accountant profile:', aErr)
      profile.accountant = null
    } else {
      profile.accountant = a
    }
  } else if (user.role === 'PRINCIPAL') {
    const { data: p, error: pErr } = await supabase.from('Principal').select('*').eq('userId', userId).single()
    if (pErr) {
      console.error('Database error fetching principal profile:', pErr)
      profile.principal = null
    } else {
      profile.principal = p
    }
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
