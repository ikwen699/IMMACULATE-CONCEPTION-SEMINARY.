export type Role = 'ADMIN' | 'PRINCIPAL' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'ACCOUNTANT'
export type Gender = 'MALE' | 'FEMALE'
export type AccountStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING'
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'
export type GradeType = 'TEST' | 'EXAM' | 'ASSIGNMENT' | 'PROJECT'
export type PaymentStatus = 'SUBMITTED' | 'ACCOUNTANT_REVIEWED' | 'PRINCIPAL_APPROVED' | 'REJECTED' | 'COMPLETED' | 'PARTIAL'

export interface UserWithProfile {
  id: string
  name: string
  email: string
  role: Role
  status: AccountStatus
  phone?: string | null
  address?: string | null
  profileImage?: string | null
  createdAt: Date
  student?: StudentProfile | null
  teacher?: TeacherProfile | null
  parent?: ParentProfile | null
  accountant?: AccountantProfile | null
  principal?: PrincipalProfile | null
}

export interface StudentProfile {
  id: string
  userId: string
  admissionNo: string
  dateOfBirth?: Date | null
  gender?: Gender | null
  classId?: string | null
  parentId?: string | null
  enrollmentDate: Date
  class?: ClassBasic | null
  parent?: ParentProfile | null
}

export interface TeacherProfile {
  id: string
  userId: string
  employeeId: string
  department?: string | null
  qualification?: string | null
}

export interface ParentProfile {
  id: string
  userId: string
  occupation?: string | null
  children?: StudentProfile[]
}

export interface AccountantProfile {
  id: string
  userId: string
  employeeId: string
}

export interface PrincipalProfile {
  id: string
  userId: string
}

export interface ClassBasic {
  id: string
  name: string
  section?: string | null
}

export interface ClassWithDetails extends ClassBasic {
  classTeacher?: {
    id: string
    user: {
      name: string
    }
  } | null
  _count?: {
    students: number
    subjects: number
  }
}

export interface SubjectBasic {
  id: string
  name: string
  code: string
}

export interface SubjectWithDetails extends SubjectBasic {
  class?: ClassBasic
  teacher?: {
    id: string
    user: {
      name: string
    }
  } | null
}

export interface AttendanceRecord {
  id: string
  studentId: string
  date: Date
  status: AttendanceStatus
  remarks?: string | null
}

export interface GradeRecord {
  id: string
  studentId: string
  subjectId: string
  termId: string
  score: number
  grade: string
  type: GradeType
  comments?: string | null
}

export interface PaymentRecord {
  id: string
  studentId: string
  feeId: string
  amount: number
  paymentDate: Date
  receiptNo: string
  paymentMethod?: string | null
  status: PaymentStatus
}

export interface DashboardStats {
  totalStudents: number
  totalTeachers: number
  totalClasses: number
  totalSubjects: number
  activeSessions: number
  pendingPayments: number
  totalRevenue: number
  attendanceRate: number
}

export interface NavItem {
  title: string
  href: string
  icon: string
  badge?: number
}

export interface SidebarNavItems {
  [key: string]: NavItem[]
}
