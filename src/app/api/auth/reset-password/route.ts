import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'
import { hashPassword } from '@/lib/auth'
export const dynamic = 'force-dynamic'


export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const { data: user } = await supabase
      .from('User')
      .select('id, resetTokenExpiry')
      .eq('resetToken', token)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 })
    }

    if (user.resetTokenExpiry && new Date(user.resetTokenExpiry) < new Date()) {
      return NextResponse.json({ error: 'Reset token has expired' }, { status: 400 })
    }

    const hashedPassword = await hashPassword(password)

    await supabase
      .from('User')
      .update({
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      })
      .eq('id', user.id)

    return NextResponse.json({
      message: 'Password has been reset successfully. You can now sign in.',
    }, { status: 200 })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}