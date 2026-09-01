import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'
import crypto from 'crypto'
export const dynamic = 'force-dynamic'


export async function POST(request: NextRequest) {
  try {
    const { email: rawEmail } = await request.json()
    const email = rawEmail?.toLowerCase()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const { data: user } = await supabase
      .from('User')
      .select('id, email')
      .eq('email', email)
      .single()

    if (!user) {
      return NextResponse.json({ 
        message: 'If an account exists with that email, you will receive a password reset link.' 
      }, { status: 200 })
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString()

    await supabase
      .from('User')
      .update({
        resetToken,
        resetTokenExpiry,
      })
      .eq('id', user.id)

    // In production, send email with reset link
    // For now, we'll just return success
    console.log(`Password reset token for ${email}: ${resetToken}`)

    return NextResponse.json({
      message: 'If an account exists with that email, you will receive a password reset link.',
    }, { status: 200 })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}