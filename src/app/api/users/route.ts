import { NextRequest, NextResponse } from 'next/server'
import { auth, hashPassword } from '@/lib/auth'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'
import { generateAdmissionNo, generateEmployeeId } from '@/lib/utils'
export const dynamic = 'force-dynamic'


interface SessionUser {
  id: string
  role: string
  name?: string
  email?: string
}

interface User {
  id: string
  name: string
  email: string
  role: string
  status: string
  phone?: string
  createdAt: string
}

interface Teacher {
  userId: string
  employeeId: string
  department?: string
  qualification?: string
}

interface Student {
  userId: string
  admissionNo: string
  classId?: string
  parentId?: string
}

interface Parent {
  id: string
  userId: string
  occupation?: string
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const userRole = (session?.user as { role?: string })?.role

    // Role-based access control
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ADMIN: full access, TEACHER: other teachers, PRINCIPAL: all users, ACCOUNTANT: read-only
    // STUDENT/PARENT: denied
    const isAdmin = userRole === 'ADMIN'
    const isTeacher = userRole === 'TEACHER'
    const isPrincipal = userRole === 'PRINCIPAL'
    const isAccountant = userRole === 'ACCOUNTANT'

    if (!isAdmin && !isTeacher && !isPrincipal && !isAccountant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const classId = searchParams.get('classId')

    // Determine role filter based on user's role
    let allowedRoleFilter: string | null = null
    if (isAdmin) {
      allowedRoleFilter = role || null
    } else if (isTeacher) {
      allowedRoleFilter = role === 'TEACHER' ? 'TEACHER' : null
    } else if (isPrincipal) {
      allowedRoleFilter = role || null
    } else if (isAccountant) {
      allowedRoleFilter = role || null
    }

    let filteredUserIds: string[] | null = null

    let query = supabase
      .from('User')
      .select('id, name, email, role, status, phone, createdAt')
      .order('createdAt', { ascending: false })

    if (allowedRoleFilter) query = query.eq('role', allowedRoleFilter)
    if (classId) {
      const { data: classStudents } = await supabase.from('Student').select('userId').eq('classId', classId)
      filteredUserIds = (classStudents || []).map(s => s.userId)
      if (filteredUserIds.length === 0) return NextResponse.json([])
    }

    if (filteredUserIds) query = query.in('id', filteredUserIds)

    if (status) query = query.eq('status', status)
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data: users, error } = await query
    if (error) throw error
    if (!users) return NextResponse.json([])

    const userIds = users.map(u => u.id)

    const { data: teachers } = await supabase.from('Teacher').select('userId, employeeId, department, qualification').in('userId', userIds)
    const { data: students } = await supabase.from('Student').select('userId, admissionNo, classId, parentId').in('userId', userIds)
    const { data: parents } = await supabase.from('Parent').select('id, userId, occupation').in('userId', userIds)

    const classIds = [...new Set((students || []).map(s => s.classId).filter(Boolean))]
    const { data: classes } = classIds.length > 0
      ? await supabase.from('Class').select('id, name, section').in('id', classIds)
      : { data: [] }

    const { data: teacherRecords } = await supabase.from('Teacher').select('id, userId').in('userId', userIds)
    const teacherRecordMap = new Map((teacherRecords || []).map(t => [t.userId, t.id]))
    const teacherMap = new Map((teachers || []).map(t => [t.userId, { ...t, teacherRecordId: teacherRecordMap.get(t.userId) || null }]))
    const studentMap = new Map((students || []).map(s => [s.userId, s]))
    const classMap = new Map((classes || []).map(c => [c.id, c]))
    const parentMap = new Map((parents || []).map(p => [p.userId, p]))

    // Fetch parent user info for students that have a parentId
    const parentIds = [...new Set((students || []).map(s => s.parentId).filter(Boolean))]
    const { data: parentRecords } = parentIds.length > 0
      ? await supabase.from('Parent').select('id, userId').in('id', parentIds)
      : { data: [] }
    const parentUserIds = [...new Set((parentRecords || []).map(p => p.userId).filter(Boolean))]
    const { data: parentUsers } = parentUserIds.length > 0
      ? await supabase.from('User').select('id, name, email').in('id', parentUserIds)
      : { data: [] }
    const parentUserMap = new Map((parentUsers || []).map(u => [u.id, u]))
    const parentRecordMap = new Map((parentRecords || []).map(p => [p.id, p]))

    const enriched = users.map(user => {
      const student = studentMap.get(user.id)
      let parentInfo = null
      if (student?.parentId) {
        const parentRecord = parentRecordMap.get(student.parentId)
        if (parentRecord) {
          parentInfo = parentUserMap.get(parentRecord.userId) || null
        }
      }
      return {
        ...user,
        createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null,
        teacher: teacherMap.get(user.id) || null,
        student: student ? { ...student, class: classMap.get(student.classId) || null, parent: parentInfo } : null,
        parent: parentMap.get(user.id) || null,
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
    if (!session?.user || (session.user as SessionUser).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email: rawEmail, password, role, phone, address, ...profileData } = body
    const email = rawEmail?.toLowerCase()

    const { data: existingUser, error: existingUserError } = await supabase
      .from('User')
      .select('id')
      .eq('email', email)

    if (existingUserError) {
      console.error('Database error checking existing user:', existingUserError)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

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

    if (userError) {
      console.error('Database error creating user:', userError)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    if (role === 'STUDENT') {
      const { error: sErr } = await supabase.from('Student').insert({
        userId: user.id,
admissionNo: generateAdmissionNo(),
        dateOfBirth: profileData.dateOfBirth ? (() => { const d = new Date(profileData.dateOfBirth); return isNaN(d.getTime()) ? null : d.toISOString() })() : null,
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
    if (!session?.user || (session.user as SessionUser).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, admissionNo, dateOfBirth, gender, classId, parentId, department, qualification, occupation, ...userData } = body

    if (!id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    if (userData.password) {
      userData.password = await hashPassword(userData.password)
    }
    if (userData.email) {
      userData.email = userData.email.toLowerCase()
    }

    let user: User | null = null

    if (Object.keys(userData).length > 0) {
      const { data, error } = await supabase
        .from('User')
        .update(userData)
        .eq('id', id)
        .select('id, name, email, role, status')
        .single()
      if (error) {
        console.error('Database error updating user:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
      }
      user = data as User | null
    } else {
      const { data, error } = await supabase
        .from('User')
        .select('id, name, email, role, status')
        .eq('id', id)
        .single()
      if (error) {
        console.error('Database error fetching user:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
      }
      user = data as User | null
    }

    if (user?.role === 'STUDENT') {
      const studentData: Record<string, unknown> = {}
      if (admissionNo !== undefined) studentData.admissionNo = admissionNo || null
      if (dateOfBirth !== undefined) studentData.dateOfBirth = dateOfBirth ? (() => { const d = new Date(dateOfBirth); return isNaN(d.getTime()) ? null : d.toISOString() })() : null
      if (gender !== undefined) studentData.gender = gender || null
      if (classId !== undefined) studentData.classId = classId || null
      if (parentId !== undefined && parentId !== '') studentData.parentId = parentId || null

      if (Object.keys(studentData).length > 0) {
        const { data: existingStudent, error: sErr } = await supabase.from('Student').select('id').eq('userId', id)

        if (sErr) {
          console.error('Database error checking student:', sErr)
        } else if (existingStudent && existingStudent.length > 0) {
          const { error: sUpdErr } = await supabase.from('Student').update(studentData).eq('id', existingStudent[0].id)
          if (sUpdErr) {
            console.error('Database error updating student:', sUpdErr)
          }
        } else {
          studentData.userId = id
          studentData.admissionNo = admissionNo || generateAdmissionNo()
          const { error: sInsErr } = await supabase.from('Student').insert(studentData)
          if (sInsErr) {
            console.error('Database error inserting student:', sInsErr)
          }
        }
      }
    } else if (user?.role === 'TEACHER') {
      const teacherData: Record<string, unknown> = {}
      if (department !== undefined) teacherData.department = department
      if (qualification !== undefined) teacherData.qualification = qualification

      if (Object.keys(teacherData).length > 0) {
        const { data: existingTeacher, error: tErr } = await supabase.from('Teacher').select('id').eq('userId', id)

        if (tErr) {
          console.error('Database error checking teacher:', tErr)
        } else if (existingTeacher && existingTeacher.length > 0) {
          const { error: tUpdErr } = await supabase.from('Teacher').update(teacherData).eq('id', existingTeacher[0].id)
          if (tUpdErr) {
            console.error('Database error updating teacher:', tUpdErr)
          }
        }
      }
    } else if (user?.role === 'PARENT') {
      const parentData: Record<string, unknown> = {}
      if (occupation !== undefined) parentData.occupation = occupation

      if (Object.keys(parentData).length > 0) {
        const { data: existingParent, error: pErr } = await supabase.from('Parent').select('id').eq('userId', id)

        if (pErr) {
          console.error('Database error checking parent:', pErr)
        } else if (existingParent && existingParent.length > 0) {
          const { error: pUpdErr } = await supabase.from('Parent').update(parentData).eq('id', existingParent[0].id)
          if (pUpdErr) {
            console.error('Database error updating parent:', pUpdErr)
          }
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
    if (!session?.user || (session.user as SessionUser).role !== 'ADMIN') {
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

    if (error) {
      console.error('Database error updating user status:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error patching user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as SessionUser).role !== 'ADMIN') {
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