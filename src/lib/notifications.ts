import { supabaseAdmin as supabase } from './supabase-server'

interface CreateNotificationParams {
  userId: string
  title: string
  message: string
  type: string
  link?: string
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    const { data, error } = await supabase
      .from('Notification')
      .insert({
        userId: params.userId,
        title: params.title,
        message: params.message,
        type: params.type,
        link: params.link,
      })
      .select()

    if (error) {
      console.error('Database error creating notification:', error)
      return null
    }
    return data?.[0] || null
  } catch (error) {
    console.error('Error creating notification:', error)
    return null
  }
}

export async function notifyPaymentSubmitted(paymentId: string, studentName: string, amount: number) {
  const { data: payment } = await supabase.from('Payment').select('id, parentId').eq('id', paymentId)

  if (!payment?.[0]?.parentId) return

  const { data: parent } = await supabase.from('Parent').select('userId').eq('id', payment[0].parentId)

  if (!parent) return

  await createNotification({
    userId: parent[0].userId,
    title: 'Payment Submitted',
    message: `Your payment of $${amount} for ${studentName} has been submitted and is awaiting review.`,
    type: 'PAYMENT',
    link: '/dashboard/fees',
  })
}

export async function notifyPaymentReviewed(paymentId: string, status: string, remarks?: string) {
  const { data: payment } = await supabase.from('Payment').select('id, parentId').eq('id', paymentId)

  if (!payment?.[0]?.parentId) return

  const { data: parent } = await supabase.from('Parent').select('userId').eq('id', payment[0].parentId)

  if (!parent) return

  const message = status === 'ACCOUNTANT_REVIEWED'
    ? `Your payment has been reviewed and forwarded to the principal for approval.`
    : `Your payment has been rejected by the accountant. ${remarks ? `Reason: ${remarks}` : ''}`

  await createNotification({
    userId: parent[0].userId,
    title: status === 'ACCOUNTANT_REVIEWED' ? 'Payment Under Review' : 'Payment Rejected',
    message,
    type: 'PAYMENT',
    link: '/dashboard/fees',
  })
}

export async function notifyPaymentApproved(paymentId: string, approved: boolean, remarks?: string) {
  const { data: payment } = await supabase.from('Payment').select('id, parentId').eq('id', paymentId)

  if (!payment?.[0]?.parentId) return

  const { data: parent } = await supabase.from('Parent').select('userId').eq('id', payment[0].parentId)

  if (!parent) return

  const message = approved
    ? `Your payment has been approved by the principal. Receipt is now available.`
    : `Your payment has been rejected by the principal. ${remarks ? `Reason: ${remarks}` : ''}`

  await createNotification({
    userId: parent[0].userId,
    title: approved ? 'Payment Approved' : 'Payment Rejected',
    message,
    type: 'PAYMENT',
    link: '/dashboard/fees',
  })
}

export async function notifyNewAnnouncement(announcementId: string, title: string, authorId: string, targetRoles?: string) {
  try {
    let query = supabase.from('User').select('id').eq('status', 'ACTIVE').neq('id', authorId)
    if (targetRoles) {
      const roles = targetRoles.split(',').map(r => r.trim()).filter(Boolean)
      if (roles.length === 1) {
        query = query.eq('role', roles[0])
      } else if (roles.length > 1) {
        query = query.in('role', roles)
      }
    }

    const { data: users, error: usersErr } = await query

    if (usersErr) {
      console.error('Error fetching users for announcement notification:', usersErr)
      return
    }

    if (!users || users.length === 0) return

    const notifications = users.map(user => ({
      userId: user.id,
      title: 'New Announcement',
      message: `New announcement: ${title}`,
      type: 'ANNOUNCEMENT',
      link: '/dashboard/announcements',
    }))

    const { error: insertErr } = await supabase.from('Notification').insert(notifications)
    if (insertErr) {
      console.error('Error inserting announcement notifications:', insertErr)
    }
  } catch (error) {
    console.error('Error in notifyNewAnnouncement:', error)
  }
}

export async function notifyGradePosted(studentId: string, subjectName: string, grade: string, score: number) {
  const { data: student } = await supabase.from('Student').select('id, userId, parentId').eq('id', studentId)

  if (!student?.[0]) return

  await createNotification({
    userId: student[0].userId,
    title: 'Grade Posted',
    message: `Your ${subjectName} result has been posted: ${score}% (${grade})`,
    type: 'GRADE',
    link: '/dashboard/grades',
  })

  if (student[0].parentId) {
    const { data: parent } = await supabase.from('Parent').select('userId').eq('id', student[0].parentId)
    if (parent) {
      const { data: studentUser } = await supabase.from('User').select('name').eq('id', student[0].userId).single()
      await createNotification({
        userId: parent[0].userId,
        title: 'Grade Posted',
        message: `${studentUser?.name || 'Student'}'s ${subjectName} result has been posted: ${score}% (${grade})`,
        type: 'GRADE',
        link: '/dashboard/grades',
      })
    }
  }
}

export async function notifyPaymentNeedsReview(paymentId: string, studentName: string, amount: number) {
  try {
    const { data: accountants, error } = await supabase
      .from('User')
      .select('id')
      .eq('role', 'ACCOUNTANT')
      .eq('status', 'ACTIVE')

    if (error || !accountants || accountants.length === 0) return

    const notifications = accountants.map(a => ({
      userId: a.id,
      title: 'Payment Awaiting Review',
      message: `New payment of ₦${amount.toLocaleString()} for ${studentName} has been submitted and needs your review.`,
      type: 'PAYMENT',
      link: '/dashboard/payment-reviews',
    }))

    const { error: insertErr } = await supabase.from('Notification').insert(notifications)
    if (insertErr) console.error('Error inserting payment review notifications:', insertErr)
  } catch (error) {
    console.error('Error in notifyPaymentNeedsReview:', error)
  }
}

export async function notifyNewAssignment(assignmentTitle: string, classId: string) {
  try {
    const { data: students, error } = await supabase
      .from('Student')
      .select('userId')
      .eq('classId', classId)

    if (error || !students || students.length === 0) return

    const notifications = students.map(s => ({
      userId: s.userId,
      title: 'New Assignment',
      message: `A new assignment has been posted: ${assignmentTitle}`,
      type: 'GRADE',
      link: '/dashboard/assignments',
    }))

    const { error: insertErr } = await supabase.from('Notification').insert(notifications)
    if (insertErr) console.error('Error inserting assignment notifications:', insertErr)
  } catch (error) {
    console.error('Error in notifyNewAssignment:', error)
  }
}

export async function notifySubmissionCreated(studentName: string, assignmentTitle: string, teacherUserId: string) {
  try {
    await createNotification({
      userId: teacherUserId,
      title: 'Assignment Submitted',
      message: `${studentName} has submitted their work for "${assignmentTitle}".`,
      type: 'GRADE',
      link: '/dashboard/assignments',
    })
  } catch (error) {
    console.error('Error in notifySubmissionCreated:', error)
  }
}
