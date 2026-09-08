import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'
import * as XLSX from 'xlsx'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const role = (session.user as any)?.role
    if (!['TEACHER', 'ADMIN', 'PRINCIPAL'].includes(role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const subjectId = searchParams.get('subjectId')
    const format = searchParams.get('format') || 'csv'

    if (!classId || !subjectId) {
      return NextResponse.json({ error: 'classId and subjectId are required' }, { status: 400 })
    }

    const { data: students, error } = await supabase
      .from('Student')
      .select('id, admissionNo, userId')
      .eq('classId', classId)
      .order('admissionNo', { ascending: true })

    if (error) throw error

    const userIds = (students || []).map(s => s.userId).filter(Boolean)
    const { data: users } = userIds.length > 0
      ? await supabase.from('User').select('id, name').in('id', userIds)
      : { data: [] }

    const userMap = new Map((users || []).map(u => [u.id, u.name]))

    const rows = (students || []).map(s => ({
      'Student Name': userMap.get(s.userId) || '',
      'Admission No': s.admissionNo || '',
      'Score': '',
    }))

    if (format === 'xlsx') {
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(rows)
      ws['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 10 }]
      XLSX.utils.book_append_sheet(wb, ws, 'Grades')
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="grades_template.xlsx"`,
        },
      })
    }

    const header = 'Student Name,Admission No,Score\n'
    const csvRows = (students || []).map(s => {
      const name = (userMap.get(s.userId) || '').includes(',') ? `"${userMap.get(s.userId)}"` : (userMap.get(s.userId) || '')
      return `${name},${s.admissionNo || ''},`
    }).join('\n')

    return new NextResponse(header + csvRows, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="grades_template.csv"`,
      },
    })
  } catch (error) {
    console.error('Error generating template:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
