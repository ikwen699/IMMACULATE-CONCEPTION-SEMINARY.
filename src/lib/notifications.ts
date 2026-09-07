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
  const { data: payment } = await supabase.from('Payment').select('id, parentId, feeId').eq('id', paymentId).single()

  if (!payment?.parentId) return

  const { data: parent } = await supabase.from('Parent').select('userId').eq('id', payment.parentId).single()

  if (!parent) return

  let feeName = 'Fee'
  if (payment.feeId) {
    const { data: fee } = await supabase.from('Fee').select('name').eq('id', payment.feeId).single()
    if (fee) feeName = fee.name
  }

  await createNotification({
    userId: parent.userId,
    title: 'Payment Submitted',
    message: `Your payment of ₦${amount.toLocaleString()} for ${feeName} (${studentName}) has been submitted and is awaiting review.`,
    type: 'PAYMENT',
    link: '/dashboard/fees',
  })
}

export async function notifyPaymentReviewed(paymentId: string, status: string, remarks?: string) {
  const { data: payment } = await supabase.from('Payment').select('id, parentId, feeId, studentId, amount').eq('id', paymentId).single()

  if (!payment) return

  let feeName = 'Fee'
  if (payment.feeId) {
    const { data: fee } = await supabase.from('Fee').select('name').eq('id', payment.feeId).single()
    if (fee) feeName = fee.name
  }

  const amount = payment.amount || 0

  let studentName = 'Student'
  if (payment.studentId) {
    const { data: studentRec } = await supabase.from('Student').select('userId').eq('id', payment.studentId).single()
    if (studentRec) {
      const { data: studentUser } = await supabase.from('User').select('name').eq('id', studentRec.userId).single()
      if (studentUser) studentName = studentUser.name
    }
  }

  // Notify parent
  if (payment.parentId) {
    const { data: parentRec } = await supabase.from('Parent').select('userId').eq('id', payment.parentId).single()
    if (parentRec?.userId) {
      const message = status === 'ACCOUNTANT_REVIEWED'
        ? `Your payment of ₦${amount.toLocaleString()} for ${feeName} has been reviewed and forwarded to the principal for approval.`
        : `Your payment of ₦${amount.toLocaleString()} for ${feeName} has been rejected by the accountant. ${remarks ? `Reason: ${remarks}` : ''}`

      await createNotification({
        userId: parentRec.userId,
        title: status === 'ACCOUNTANT_REVIEWED' ? 'Payment Under Review' : 'Payment Rejected',
        message,
        type: 'PAYMENT',
        link: '/dashboard/fees',
      })
    }
  }

  // Notify principal when accountant forwards
  if (status === 'ACCOUNTANT_REVIEWED') {
    const { data: principals } = await supabase
      .from('User')
      .select('id')
      .eq('role', 'PRINCIPAL')
      .eq('status', 'ACTIVE')

    if (principals && principals.length > 0) {
      let parentName = 'A parent'
      if (payment.parentId) {
        const { data: parentRec } = await supabase.from('Parent').select('userId').eq('id', payment.parentId).single()
        if (parentRec) {
          const { data: parentUser } = await supabase.from('User').select('name').eq('id', parentRec.userId).single()
          if (parentUser) parentName = parentUser.name
        }
      }

      const notifications = principals.map(p => ({
        userId: p.id,
        title: 'Payment Forwarded for Approval',
        message: `${parentName} has paid ₦${amount.toLocaleString()} for ${feeName} (Student: ${studentName}). The accountant has forwarded this payment for your approval.`,
        type: 'PAYMENT',
        link: '/dashboard/payment-approvals',
      }))

      const { error: insertErr } = await supabase.from('Notification').insert(notifications)
      if (insertErr) console.error('Error inserting principal notification:', insertErr)
    }
  }
}

export async function notifyPaymentApproved(paymentId: string, approved: boolean, remarks?: string) {
  const { data: payment } = await supabase.from('Payment').select('id, parentId, feeId, amount').eq('id', paymentId).single()

  if (!payment) return

  let feeName = 'Fee'
  if (payment.feeId) {
    const { data: fee } = await supabase.from('Fee').select('name').eq('id', payment.feeId).single()
    if (fee) feeName = fee.name
  }

  const amount = payment.amount || 0

  if (!payment.parentId) return

  const { data: parentRec } = await supabase.from('Parent').select('userId').eq('id', payment.parentId).single()
  if (!parentRec?.userId) return

  const message = approved
    ? `Your payment of ₦${amount.toLocaleString()} for ${feeName} has been approved by the principal. Receipt is now available.`
    : `Your payment of ₦${amount.toLocaleString()} for ${feeName} has been rejected by the principal. ${remarks ? `Reason: ${remarks}` : ''}`

  await createNotification({
    userId: parentRec.userId,
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
    const { data: payment } = await supabase
      .from('Payment')
      .select('id, parentId, feeId')
      .eq('id', paymentId)
      .single()

    if (!payment) return

    let parentName = 'A parent'
    if (payment.parentId) {
      const { data: parentRec } = await supabase.from('Parent').select('userId').eq('id', payment.parentId).single()
      if (parentRec) {
        const { data: parentUser } = await supabase.from('User').select('name').eq('id', parentRec.userId).single()
        if (parentUser) parentName = parentUser.name
      }
    }

    let feeName = 'Fee'
    if (payment.feeId) {
      const { data: fee } = await supabase.from('Fee').select('name').eq('id', payment.feeId).single()
      if (fee) feeName = fee.name
    }

    const { data: accountants, error } = await supabase
      .from('User')
      .select('id')
      .eq('role', 'ACCOUNTANT')
      .eq('status', 'ACTIVE')

    if (error || !accountants || accountants.length === 0) return

    const notifications = accountants.map(a => ({
      userId: a.id,
      title: 'Payment Awaiting Review',
      message: `${parentName} has paid ₦${amount.toLocaleString()} for ${feeName} (Student: ${studentName}). Please review.`,
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
