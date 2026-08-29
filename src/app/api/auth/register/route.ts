import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'
import { hashPassword } from '@/lib/auth'
import { generateAdmissionNo, generateEmployeeId } from '@/lib/utils'

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

    const { data: existingUser } = await supabase
      .from('User')
      .select('id')
      .eq('email', email)
      .single()

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
      .single()

    if (userError) throw userError

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
          .single()

        if (puErr) throw puErr

        const { data: parentProfile, error: ppErr } = await supabase
          .from('Parent')
          .insert({ userId: parentUser.id })
          .select()
          .single()

        if (ppErr) throw ppErr
        parentId = parentProfile.id
      }

      const { error: sErr } = await supabase
        .from('Student')
        .insert({
          userId: user.id,
          admissionNo: generateAdmissionNo(),
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : null,
          gender: gender || null,
          parentId,
        })

      if (sErr) throw sErr
    } else if (role === 'TEACHER') {
      const { error: tErr } = await supabase
        .from('Teacher')
        .insert({
          userId: user.id,
          employeeId: generateEmployeeId('TCH'),
          department,
          qualification,
        })

      if (tErr) throw tErr
    } else if (role === 'PARENT') {
      const { error: pErr } = await supabase
        .from('Parent')
        .insert({
          userId: user.id,
          occupation: occupation || null,
        })

      if (pErr) throw pErr
    } else if (role === 'ACCOUNTANT') {
      const { error: aErr } = await supabase
        .from('Accountant')
        .insert({
          userId: user.id,
          employeeId: generateEmployeeId('ACC'),
        })

      if (aErr) throw aErr
    } else if (role === 'PRINCIPAL') {
      const { error: prErr } = await supabase
        .from('Principal')
        .insert({
          userId: user.id,
        })

      if (prErr) throw prErr
    }
    // ADMIN doesn't have a separate profile table

    return NextResponse.json({
      message: 'Registration successful! Your account is pending admin approval.',
      userId: user.id,
    }, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
