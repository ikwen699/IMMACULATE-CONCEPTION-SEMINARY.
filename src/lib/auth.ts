import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { supabaseAdmin as supabase } from './supabase-server'
import bcrypt from 'bcryptjs'

async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        rememberMe: { label: 'Remember me', type: 'boolean' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const { data: user } = await supabase
          .from('User')
          .select('*')
          .eq('email', credentials.email as string)
          .single()

        if (!user) {
          return null
        }

        if (user.status === 'PENDING') {
          throw new Error('PENDING_APPROVAL')
        }

        if (user.status === 'INACTIVE' || user.status === 'SUSPENDED') {
          throw new Error('ACCOUNT_INACTIVE')
        }

        if (user.status !== 'ACTIVE') {
          return null
        }

        const isValid = await verifyPassword(credentials.password as string, user.password)
        if (!isValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          rememberMe: credentials.rememberMe === true || credentials.rememberMe === 'true',
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days default
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.userId = user.id
        token.rememberMe = (user as any).rememberMe
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role as string
        (session.user as any).userId = token.userId as string
        (session.user as any).rememberMe = token.rememberMe as boolean
      }
      return session
    }
  },
  pages: {
    signIn: '/login'
  }
})

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12)
  return bcrypt.hash(password, salt)
}
