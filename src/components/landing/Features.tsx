import {
  GraduationCap,
  BookOpen,
  CalendarCheck,
  Wallet,
  Megaphone,
  Bell,
} from 'lucide-react'

const features = [
  {
    icon: <GraduationCap className="w-6 h-6" />,
    title: 'Live Grades',
    description:
      'View CA scores, exam results, and overall grades in real-time — updated as soon as they are uploaded.',
    color: 'bg-blue-600',
    light: 'bg-blue-50 text-blue-700',
  },
  {
    icon: <BookOpen className="w-6 h-6" />,
    title: 'Assignments & Timetables',
    description:
      'Access class schedules, submit assignments online, and never miss a deadline again.',
    color: 'bg-violet-600',
    light: 'bg-violet-50 text-violet-700',
  },
  {
    icon: <CalendarCheck className="w-6 h-6" />,
    title: 'Attendance Tracking',
    description:
      'Monitor daily attendance records and track presence across every term and session.',
    color: 'bg-emerald-600',
    light: 'bg-emerald-50 text-emerald-700',
  },
  {
    icon: <Wallet className="w-6 h-6" />,
    title: 'Fee Management',
    description:
      'View fee breakdowns, track payment status, and download receipts — all from one place.',
    color: 'bg-amber-600',
    light: 'bg-amber-50 text-amber-700',
  },
  {
    icon: <Megaphone className="w-6 h-6" />,
    title: 'Announcements',
    description:
      'Stay informed with school-wide announcements, circulars, and important updates.',
    color: 'bg-rose-600',
    light: 'bg-rose-50 text-rose-700',
  },
  {
    icon: <Bell className="w-6 h-6" />,
    title: 'Real-Time Notifications',
    description:
      'Receive instant alerts for new grades, fee deadlines, and messages from teachers or admins.',
    color: 'bg-sky-600',
    light: 'bg-sky-50 text-sky-700',
  },
]

export default function Features() {
  return (
    <section id="features" className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-14">
          <span className="inline-block text-[11px] font-semibold tracking-wide text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full uppercase mb-4">
            Portal Features
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
            Everything You Need, One Place
          </h2>
          <p className="text-gray-500 mt-3 max-w-2xl mx-auto leading-relaxed">
            From grades to fees, our portal keeps students, parents, and teachers connected
            with the information that matters most.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="group p-7 rounded-2xl border border-gray-100 bg-gray-50/60 hover:bg-white hover:shadow-lg hover:shadow-blue-500/5 hover:border-blue-100 transition-all duration-300"
            >
              <div
                className={`inline-flex items-center justify-center w-12 h-12 rounded-xl text-white mb-5 transition-all duration-300 group-hover:scale-110 ${f.color}`}
              >
                {f.icon}
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
