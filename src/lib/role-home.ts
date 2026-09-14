export const ROLE_HOME_UI: Record<string, string> = {
  ADMIN: '/dashboard',
  PRINCIPAL: '/dashboard/overview',
  TEACHER: '/dashboard/results',
  ACCOUNTANT: '/dashboard/payment-reviews',
  STUDENT: '/dashboard/grades',
  PARENT: '/dashboard/children',
}

export function roleHome(role?: string | null): string {
  return ROLE_HOME_UI[role ?? ''] ?? '/dashboard'
}