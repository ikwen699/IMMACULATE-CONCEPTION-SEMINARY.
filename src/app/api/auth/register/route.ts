import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'
import { hashPassword } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email: rawEmail, password } = body

    const email = rawEmail?.toLowerCase()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const { data: existingUser, error: existingUserError } = await supabase
      .from('User')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUserError && existingUserError.code !== 'PGRST116') {
      console.error('Database error checking existing user:', existingUserError)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
    }

    const hashedPassword = await hashPassword(password)
    const name = email.split('@')[0].replace(/[^a-zA-Z]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())

    const { data: user, error: userError } = await supabase
      .from('User')
      .insert({
        name,
        email,
        password: hashedPassword,
        role: 'STUDENT',
        status: 'PENDING',
      })
      .select()

    if (userError) {
      console.error('Database error creating user:', userError)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Registration successful! Your account is pending admin approval.',
      userId: user?.[0]?.id,
    }, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
