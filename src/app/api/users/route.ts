import { NextRequest, NextResponse } from 'next/server'
import { auth, hashPassword } from '@/lib/auth'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'
import { generateAdmissionNo, generateEmployeeId } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const classId = searchParams.get('classId')

    let filteredUserIds: string[] | null = null
    if (classId) {
      const { data: classStudents } = await supabase.from('Student').select('userId').eq('classId', classId)
      filteredUserIds = (classStudents || []).map(s => s.userId)
      if (filteredUserIds.length === 0) return NextResponse.json([])
    }

    let query = supabase
      .from('User')
      .select('id, name, email, role, status, phone, createdAt')
      .order('createdAt', { ascending: false })

    if (role) query = query.eq('role', role)
    if (status) query = query.eq('status', status)
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }
    if (filteredUserIds) {
      query = query.in('id', filteredUserIds)
    }

    const { data: users, error } = await query
    if (error) throw error
    if (!users) return NextResponse.json([])

    const userIds = users.map(u => u.id)

    const { data: teachers } = await supabase.from('Teacher').select('userId, employeeId, department').in('userId', userIds)
    const { data: students } = await supabase.from('Student').select('userId, admissionNo, classId').in('userId', userIds)

    const classIds = [...new Set((students || []).map(s => s.classId).filter(Boolean))]
    const { data: classes } = classIds.length > 0
      ? await supabase.from('Class').select('id, name, section').in('id', classIds)
      : { data: [] }

    const { data: teacherRecords } = await supabase.from('Teacher').select('id, userId').in('userId', userIds)
    const teacherRecordMap = new Map((teacherRecords || []).map(t => [t.userId, t.id]))
    const teacherMap = new Map((teachers || []).map(t => [t.userId, { ...t, teacherRecordId: teacherRecordMap.get(t.userId) || null }]))
    const studentMap = new Map((students || []).map(s => [s.userId, s]))
    const classMap = new Map((classes || []).map(c => [c.id, c]))

    const enriched = users.map(user => {
      const student = studentMap.get(user.id)
      return {
        ...user,
        teacher: teacherMap.get(user.id) || null,
        student: student ? { ...student, class: classMap.get(student.classId) || null } : null,
      }
    })

    return NextResponse.json(enriched)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, password, role, phone, address, ...profileData } = body

    const { data: existingUser } = await supabase
      .from('User')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    }

    const hashedPassword = await hashPassword(password || 'password123')

    const { data: user, error: userError } = await supabase
      .from('User')
      .insert({
        name,
        email,
        password: hashedPassword,
        role,
        phone,
        address,
      })
      .select('id, name, email, role, status')
      .single()

    if (userError) throw userError

    if (role === 'STUDENT') {
      const { error: sErr } = await supabase.from('Student').insert({
        userId: user.id,
        admissionNo: generateAdmissionNo(),
        dateOfBirth: profileData.dateOfBirth ? new Date(profileData.dateOfBirth).toISOString() : null,
        gender: profileData.gender,
        classId: profileData.classId,
        parentId: profileData.parentId,
      })
      if (sErr) throw sErr
    } else if (role === 'TEACHER') {
      const { error: tErr } = await supabase.from('Teacher').insert({
        userId: user.id,
        employeeId: generateEmployeeId('TCH'),
        department: profileData.department,
        qualification: profileData.qualification,
      })
      if (tErr) throw tErr
    } else if (role === 'PARENT') {
      const { error: pErr } = await supabase.from('Parent').insert({
        userId: user.id,
        occupation: profileData.occupation,
      })
      if (pErr) throw pErr
    } else if (role === 'ACCOUNTANT') {
      const { error: aErr } = await supabase.from('Accountant').insert({
        userId: user.id,
        employeeId: generateEmployeeId('ACC'),
      })
      if (aErr) throw aErr
    } else if (role === 'PRINCIPAL') {
      const { error: prErr } = await supabase.from('Principal').insert({
        userId: user.id,
      })
      if (prErr) throw prErr
    }

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, admissionNo, dateOfBirth, gender, classId, department, qualification, ...userData } = body

    if (!id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    if (userData.password) {
      userData.password = await hashPassword(userData.password)
    }

    let user: any = null

    if (Object.keys(userData).length > 0) {
      const { data, error } = await supabase
        .from('User')
        .update(userData)
        .eq('id', id)
        .select('id, name, email, role, status')
        .single()
      if (error) throw error
      user = data
    } else {
      const { data, error } = await supabase
        .from('User')
        .select('id, name, email, role, status')
        .eq('id', id)
        .single()
      if (error) throw error
      user = data
    }

    if (user.role === 'STUDENT') {
      const studentData: any = {}
      if (admissionNo !== undefined) studentData.admissionNo = admissionNo || null
      if (dateOfBirth !== undefined) studentData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth).toISOString() : null
      if (gender !== undefined) studentData.gender = gender || null
      if (classId !== undefined) studentData.classId = classId || null

      if (Object.keys(studentData).length > 0) {
        const { data: existingStudent } = await supabase.from('Student').select('id').eq('userId', id).single()

        if (existingStudent) {
          const { error: sErr } = await supabase.from('Student').update(studentData).eq('id', existingStudent.id)
          if (sErr) throw sErr
        } else {
          studentData.userId = id
          studentData.admissionNo = admissionNo || generateAdmissionNo()
          const { error: sErr } = await supabase.from('Student').insert(studentData)
          if (sErr) throw sErr
        }
      }
    } else if (user.role === 'TEACHER') {
      const teacherData: any = {}
      if (department !== undefined) teacherData.department = department
      if (qualification !== undefined) teacherData.qualification = qualification

      if (Object.keys(teacherData).length > 0) {
        const { data: existingTeacher } = await supabase.from('Teacher').select('id').eq('userId', id).single()
        if (existingTeacher) {
          const { error: tErr } = await supabase.from('Teacher').update(teacherData).eq('id', existingTeacher.id)
          if (tErr) throw tErr
        }
      }
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'User ID and status required' }, { status: 400 })
    }

    const { data: user, error } = await supabase
      .from('User')
      .update({ status })
      .eq('id', id)
      .select('id, name, email, role, status')
      .single()

    if (error) throw error
    return NextResponse.json(user)
  } catch (error) {
    console.error('Error patching user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const { error } = await supabase.from('User').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ message: 'User deleted' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
