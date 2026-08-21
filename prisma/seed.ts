import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const { data: admin } = await supabase
    .from('User')
    .upsert({ email: 'admin@ics.edu' }, { onConflict: 'email' })
    .select()
    .single()

  if (admin) {
    await supabase.from('User').update({
      name: 'System Admin',
      password: adminPassword,
      role: 'ADMIN',
      phone: '+1234567890',
    }).eq('id', admin.id)
  }
  console.log('Admin user created: admin@ics.edu')

  // Create principal user
  const principalPassword = await bcrypt.hash('principal123', 12)
  const { data: principal } = await supabase
    .from('User')
    .upsert({ email: 'principal@ics.edu' }, { onConflict: 'email' })
    .select()
    .single()

  if (principal) {
    await supabase.from('User').update({
      name: 'Fr. John Smith',
      password: principalPassword,
      role: 'PRINCIPAL',
      phone: '+1234567891',
    }).eq('id', principal.id)

    await supabase.from('Principal').upsert({ userId: principal.id }, { onConflict: 'userId' })
  }
  console.log('Principal user created: principal@ics.edu')

  // Create teacher user
  const teacherPassword = await bcrypt.hash('teacher123', 12)
  const { data: teacher } = await supabase
    .from('User')
    .upsert({ email: 'teacher@ics.edu' }, { onConflict: 'email' })
    .select()
    .single()

  if (teacher) {
    await supabase.from('User').update({
      name: 'Mrs. Mary Johnson',
      password: teacherPassword,
      role: 'TEACHER',
      phone: '+1234567892',
    }).eq('id', teacher.id)

    await supabase.from('Teacher').upsert({
      userId: teacher.id,
      employeeId: 'TCH/2024/001',
      department: 'Mathematics',
      qualification: 'M.Sc Mathematics',
    }, { onConflict: 'userId' })
  }
  console.log('Teacher user created: teacher@ics.edu')

  // Create accountant user
  const accountantPassword = await bcrypt.hash('accountant123', 12)
  const { data: accountant } = await supabase
    .from('User')
    .upsert({ email: 'accountant@ics.edu' }, { onConflict: 'email' })
    .select()
    .single()

  if (accountant) {
    await supabase.from('User').update({
      name: 'Mr. David Williams',
      password: accountantPassword,
      role: 'ACCOUNTANT',
      phone: '+1234567893',
    }).eq('id', accountant.id)

    await supabase.from('Accountant').upsert({
      userId: accountant.id,
      employeeId: 'ACC/2024/001',
    }, { onConflict: 'userId' })
  }
  console.log('Accountant user created: accountant@ics.edu')

  // Create parent user
  const parentPassword = await bcrypt.hash('parent123', 12)
  const { data: parent } = await supabase
    .from('User')
    .upsert({ email: 'parent@ics.edu' }, { onConflict: 'email' })
    .select()
    .single()

  if (parent) {
    await supabase.from('User').update({
      name: 'Mr. James Brown',
      password: parentPassword,
      role: 'PARENT',
      phone: '+1234567894',
    }).eq('id', parent.id)

    await supabase.from('Parent').upsert({
      userId: parent.id,
      occupation: 'Engineer',
    }, { onConflict: 'userId' })
  }
  console.log('Parent user created: parent@ics.edu')

  // Create student user
  const studentPassword = await bcrypt.hash('student123', 12)
  const { data: student } = await supabase
    .from('User')
    .upsert({ email: 'student@ics.edu' }, { onConflict: 'email' })
    .select()
    .single()

  if (student) {
    await supabase.from('User').update({
      name: 'Peter Brown',
      password: studentPassword,
      role: 'STUDENT',
      phone: '+1234567895',
    }).eq('id', student.id)

    const { data: parentProfile } = await supabase
      .from('Parent')
      .select('id')
      .eq('userId', parent?.id || '')
      .single()

    await supabase.from('Student').upsert({
      userId: student.id,
      admissionNo: 'ICS/2024/001',
      dateOfBirth: '2010-05-15T00:00:00Z',
      gender: 'MALE',
      parentId: parentProfile?.id,
    }, { onConflict: 'userId' })
  }
  console.log('Student user created: student@ics.edu')

  // Create academic session with terms
  const { data: academicSession } = await supabase
    .from('AcademicSession')
    .insert({
      name: '2024/2025',
      startDate: '2024-09-01T00:00:00Z',
      endDate: '2025-07-31T00:00:00Z',
      isCurrent: true,
    })
    .select()
    .single()

  if (academicSession) {
    await supabase.from('Term').insert([
      {
        sessionId: academicSession.id,
        name: 'First Term',
        startDate: '2024-09-01T00:00:00Z',
        endDate: '2024-12-15T00:00:00Z',
        isCurrent: true,
      },
      {
        sessionId: academicSession.id,
        name: 'Second Term',
        startDate: '2025-01-06T00:00:00Z',
        endDate: '2025-04-04T00:00:00Z',
        isCurrent: false,
      },
      {
        sessionId: academicSession.id,
        name: 'Third Term',
        startDate: '2025-04-21T00:00:00Z',
        endDate: '2025-07-31T00:00:00Z',
        isCurrent: false,
      },
    ])
  }
  console.log('Academic session created: 2024/2025')

  // Create classes
  const { data: teacherProfile } = await supabase
    .from('Teacher')
    .select('id')
    .eq('userId', teacher?.id || '')
    .single()

  const { data: classes } = await supabase
    .from('Class')
    .insert([
      { name: 'JSS 1', section: 'A', classTeacherId: teacherProfile?.id, capacity: 40 },
      { name: 'JSS 2', section: 'A', capacity: 40 },
      { name: 'JSS 3', section: 'A', capacity: 40 },
      { name: 'SSS 1', section: 'A', capacity: 35 },
      { name: 'SSS 2', section: 'A', capacity: 35 },
      { name: 'SSS 3', section: 'A', capacity: 35 },
    ])
    .select()

  console.log('Classes created:', classes?.length || 0)

  // Create subjects
  if (classes && classes.length > 0) {
    await supabase.from('Subject').insert([
      { name: 'Mathematics', code: 'MATH101', classId: classes[0].id, teacherId: teacherProfile?.id },
      { name: 'English Language', code: 'ENG101', classId: classes[0].id, teacherId: teacherProfile?.id },
      { name: 'Basic Science', code: 'SCI101', classId: classes[0].id, teacherId: teacherProfile?.id },
      { name: 'Social Studies', code: 'SST101', classId: classes[0].id, teacherId: teacherProfile?.id },
      { name: 'Christian Religious Studies', code: 'CRS101', classId: classes[0].id, teacherId: teacherProfile?.id },
    ])
  }
  console.log('Subjects created: 5')

  // Create school info
  await supabase.from('SchoolInfo').upsert({
    id: 'default',
    name: 'IMMACULATE CONCEPTION SEMINARY',
    address: '123 Seminary Road, Lagos, Nigeria',
    phone: '+234-123-456-7890',
    email: 'info@ics.edu',
    website: 'https://www.ics.edu',
    motto: 'Faith and Knowledge',
  }, { onConflict: 'id' })
  console.log('School info created')

  console.log('\nSeed completed successfully!')
  console.log('\nLogin credentials:')
  console.log('Admin: admin@ics.edu / admin123')
  console.log('Principal: principal@ics.edu / principal123')
  console.log('Teacher: teacher@ics.edu / teacher123')
  console.log('Student: student@ics.edu / student123')
  console.log('Parent: parent@ics.edu / parent123')
  console.log('Accountant: accountant@ics.edu / accountant123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
