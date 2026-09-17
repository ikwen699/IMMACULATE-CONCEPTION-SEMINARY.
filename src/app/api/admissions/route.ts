import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'
import { hashPassword } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const VALID_CLASSES = ['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3']

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name: rawName,
      email: rawEmail,
      password,
      phone,
      dateOfBirth,
      gender,
      classAppliedFor,
    } = body

    const email = rawEmail?.toLowerCase()
    const name = rawName?.trim()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    if (gender && !['MALE', 'FEMALE'].includes(gender)) {
      return NextResponse.json({ error: 'Please select a valid gender' }, { status: 400 })
    }

    if (classAppliedFor && !VALID_CLASSES.includes(classAppliedFor)) {
      return NextResponse.json({ error: 'Please select a valid class' }, { status: 400 })
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

    const { data: user, error: userError } = await supabase
      .from('User')
      .insert({
        name,
        email,
        password: hashedPassword,
        role: 'STUDENT',
        status: 'PENDING',
        phone: phone?.trim() || null,
      })
      .select()

    if (userError) {
      console.error('Database error creating applicant user:', userError)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const userId = user?.[0]?.id
    if (!userId) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const dob = dateOfBirth
      ? (() => {
          const d = new Date(dateOfBirth)
          return isNaN(d.getTime()) ? null : d.toISOString()
        })()
      : null

    const { error: studentError } = await supabase.from('Student').insert({
      userId,
      dateOfBirth: dob,
      gender: gender || null,
      classAppliedFor: classAppliedFor || null,
    })

    if (studentError) {
      console.error('Database error creating student record:', studentError)
      await supabase.from('User').delete().eq('id', userId)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Application received! Your account is pending admin approval. You will be able to log in once it is approved.',
      userId,
    }, { status: 201 })
  } catch (error) {
    console.error('Admission application error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}