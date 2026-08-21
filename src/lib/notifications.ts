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
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating notification:', error)
    return null
  }
}

export async function notifyPaymentSubmitted(paymentId: string, studentName: string, amount: number) {
  const { data: payment } = await supabase.from('Payment').select('id, parentId').eq('id', paymentId).single()
  if (!payment?.parentId) return

  const { data: parent } = await supabase.from('Parent').select('userId').eq('id', payment.parentId).single()
  if (!parent) return

  await createNotification({
    userId: parent.userId,
    title: 'Payment Submitted',
    message: `Your payment of $${amount} for ${studentName} has been submitted and is awaiting review.`,
    type: 'PAYMENT',
    link: '/dashboard/fees',
  })
}

export async function notifyPaymentReviewed(paymentId: string, status: string, remarks?: string) {
  const { data: payment } = await supabase.from('Payment').select('id, parentId').eq('id', paymentId).single()
  if (!payment?.parentId) return

  const { data: parent } = await supabase.from('Parent').select('userId').eq('id', payment.parentId).single()
  if (!parent) return

  const message = status === 'ACCOUNTANT_REVIEWED'
    ? `Your payment has been reviewed and forwarded to the principal for approval.`
    : `Your payment has been rejected by the accountant. ${remarks ? `Reason: ${remarks}` : ''}`

  await createNotification({
    userId: parent.userId,
    title: status === 'ACCOUNTANT_REVIEWED' ? 'Payment Under Review' : 'Payment Rejected',
    message,
    type: 'PAYMENT',
    link: '/dashboard/fees',
  })
}

export async function notifyPaymentApproved(paymentId: string, approved: boolean, remarks?: string) {
  const { data: payment } = await supabase.from('Payment').select('id, parentId').eq('id', paymentId).single()
  if (!payment?.parentId) return

  const { data: parent } = await supabase.from('Parent').select('userId').eq('id', payment.parentId).single()
  if (!parent) return

  const message = approved
    ? `Your payment has been approved by the principal. Receipt is now available.`
    : `Your payment has been rejected by the principal. ${remarks ? `Reason: ${remarks}` : ''}`

  await createNotification({
    userId: parent.userId,
    title: approved ? 'Payment Approved' : 'Payment Rejected',
    message,
    type: 'PAYMENT',
    link: '/dashboard/fees',
  })
}

export async function notifyNewAnnouncement(announcementId: string, title: string, targetRole?: string) {
  let query = supabase.from('User').select('id').eq('status', 'ACTIVE')
  if (targetRole) query = query.eq('role', targetRole)

  const { data: users } = await query
  if (!users || users.length === 0) return

  const notifications = users.map(user => ({
    userId: user.id,
    title: 'New Announcement',
    message: `New announcement: ${title}`,
    type: 'ANNOUNCEMENT',
    link: '/dashboard/announcements',
  }))

  await supabase.from('Notification').insert(notifications)
}

export async function notifyGradePosted(studentId: string, subjectName: string, grade: string, score: number) {
  const { data: student } = await supabase.from('Student').select('id, userId, parentId').eq('id', studentId).single()
  if (!student) return

  await createNotification({
    userId: student.userId,
    title: 'Grade Posted',
    message: `Your ${subjectName} result has been posted: ${score}% (${grade})`,
    type: 'GRADE',
    link: '/dashboard/grades',
  })

  if (student.parentId) {
    const { data: parent } = await supabase.from('Parent').select('userId').eq('id', student.parentId).single()
    if (parent) {
      const { data: studentUser } = await supabase.from('User').select('name').eq('id', student.userId).single()
      await createNotification({
        userId: parent.userId,
        title: 'Grade Posted',
        message: `${studentUser?.name || 'Student'}'s ${subjectName} result has been posted: ${score}% (${grade})`,
        type: 'GRADE',
        link: '/dashboard/grades',
      })
    }
  }
}
