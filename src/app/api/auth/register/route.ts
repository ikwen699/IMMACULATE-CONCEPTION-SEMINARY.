import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'
import { hashPassword } from '@/lib/auth'
import { generateAdmissionNo, generateEmployeeId } from '@/lib/utils'
export const dynamic = 'force-dynamic'


const ALLOWED_ROLES = ['STUDENT', 'TEACHER', 'PARENT', 'PRINCIPAL', 'ADMIN', 'ACCOUNTANT'] as const

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      email,
      password,
      role,
      phone,
      address,
      dateOfBirth,
      gender,
      parentName,
      parentEmail,
      parentPhone,
      department,
      qualification,
      occupation,
    } = body

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const { data: existingUser, error: existingUserError } = await supabase
      .from('User')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUserError) {
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
        role,
        status: 'PENDING',
        phone,
        address,
      })
      .select()

    const currentUser = user?.[0]

    if (userError) {
      console.error('Database error creating user:', userError)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    if (role === 'STUDENT') {
      let parentId: string | undefined

      if (parentName) {
        const generateRandomPassword = () => Math.random().toString(36).substring(2, 10)
        const parentPassword = await hashPassword(generateRandomPassword())
        const { data: parentUser, error: puErr } = await supabase
          .from('User')
          .insert({
            name: parentName,
            email: parentEmail || `parent_${Date.now()}@placeholder.com`,
            password: parentPassword,
            role: 'PARENT',
            status: 'PENDING',
            phone: parentPhone,
          })
          .select()

        if (puErr) {
          console.error('Database error creating parent user:', puErr)
          return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
        }

        const currentParentUser = parentUser?.[0]

        const { data: parentProfile, error: ppErr } = await supabase
          .from('Parent')
          .insert({ userId: currentParentUser?.id })
          .select()

        if (ppErr) {
          console.error('Database error creating parent profile:', ppErr)
          return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
        }
        parentId = currentParentUser?.id
      }

      const { error: sErr } = await supabase
        .from('Student')
        .insert({
          userId: currentUser?.id,
          admissionNo: generateAdmissionNo(),
          dateOfBirth: dateOfBirth ? (() => { const d = new Date(dateOfBirth); return isNaN(d.getTime()) ? null : d.toISOString() })() : null,
          gender: gender || null,
          parentId,
        })

      if (sErr) {
        console.error('Database error creating student profile:', sErr)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
      }
    } else if (role === 'TEACHER') {
      const { error: tErr } = await supabase
        .from('Teacher')
        .insert({
          userId: currentUser?.id,
          employeeId: generateEmployeeId('TCH'),
          department,
          qualification,
        })

      if (tErr) {
        console.error('Database error creating teacher profile:', tErr)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
      }
    } else if (role === 'PARENT') {
      const { error: pErr } = await supabase
        .from('Parent')
        .insert({
          userId: currentUser?.id,
          occupation: occupation || null,
        })

      if (pErr) {
        console.error('Database error creating parent profile:', pErr)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
      }
    } else if (role === 'ACCOUNTANT') {
      const { error: aErr } = await supabase
        .from('Accountant')
        .insert({
          userId: currentUser?.id,
          employeeId: generateEmployeeId('ACC'),
        })

      if (aErr) {
        console.error('Database error creating accountant profile:', aErr)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
      }
    } else if (role === 'PRINCIPAL') {
      const { error: prErr } = await supabase
        .from('Principal')
        .insert({
          userId: currentUser?.id,
        })

      if (prErr) {
        console.error('Database error creating principal profile:', prErr)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
      }
    }
    // ADMIN doesn't have a separate profile table

    return NextResponse.json({
      message: 'Registration successful! Your account is pending admin approval.',
      userId: currentUser?.id,
    }, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}