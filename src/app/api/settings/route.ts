import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'
export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let { data: schoolInfo } = await supabase
      .from('SchoolInfo')
      .select('*')
      .eq('id', 'default')
      .single()

    if (!schoolInfo) {
      const { data: created } = await supabase
        .from('SchoolInfo')
        .insert({ id: 'default', name: 'IMMACULATE CONCEPTION SEMINARY' })
        .select()
        .single()
      schoolInfo = created
    }

    if (!schoolInfo) {
      return NextResponse.json({ id: 'default', name: 'IMMACULATE CONCEPTION SEMINARY', address: '', phone: '', email: '', website: '', motto: '' })
    }

    return NextResponse.json(schoolInfo)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { name, address, phone, email, website, motto } = body

    const { data: existing } = await supabase
      .from('SchoolInfo')
      .select('id')
      .eq('id', 'default')
      .single()

    let schoolInfo

    if (existing) {
      const { data, error } = await supabase
        .from('SchoolInfo')
        .update({ name, address, phone, email, website, motto })
        .eq('id', 'default')
        .select()
        .single()

      if (error) throw error
      schoolInfo = data
    } else {
      const { data, error } = await supabase
        .from('SchoolInfo')
        .insert({ id: 'default', name: name || 'IMMACULATE CONCEPTION SEMINARY', address, phone, email, website, motto })
        .select()
        .single()

      if (error) throw error
      schoolInfo = data
    }

    return NextResponse.json(schoolInfo)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
