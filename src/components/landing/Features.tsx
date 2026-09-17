import {
  GraduationCap,
  BookOpen,
  CalendarCheck,
  Wallet,
  Megaphone,
  Bell,
  TrendingUp,
} from 'lucide-react'
import SectionHeading from './ui/SectionHeading'
import Reveal from './ui/Reveal'

const barData = [65, 45, 80, 55, 90]

export default function Features() {
  return (
    <section id="features" className="py-20 sm:py-24 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="Portal Features"
            title="Everything You Need, One Place"
            sub="From grades to fees, our portal keeps students, parents, and teachers connected with the information that matters most."
          />
        </Reveal>

        <div className="grid md:grid-cols-3 gap-5">
          <Reveal delay={50} className="md:col-span-2">
            <div className="relative bg-gradient-to-br from-blue-900 to-blue-800 rounded-3xl p-8 sm:p-10 text-white overflow-hidden group hover:shadow-xl hover:shadow-blue-600/10 transition-all duration-300 h-full flex flex-col">
              <div className="absolute -top-16 -right-16 w-48 h-48 bg-gold-400/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-400/10 rounded-full blur-3xl" />
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-white/15 ring-1 ring-white/20 flex items-center justify-center mb-5">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <h3 className="font-display text-xl sm:text-2xl font-semibold mb-2">Live Grades</h3>
                  <p className="text-blue-100/70 text-[15px] leading-relaxed max-w-sm">
                    View CA scores, exam results, and overall grades in real-time — updated as soon as they are uploaded.
                  </p>
                </div>
                <div className="mt-8 bg-white/[0.08] rounded-2xl p-4 ring-1 ring-white/[0.08]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Performance Trend</span>
                    <TrendingUp className="w-3.5 h-3.5 text-gold-400" />
                  </div>
                  <div className="flex items-end gap-1.5 h-20">
                    {barData.map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                        <div
                          className="w-full rounded-t-md bg-gradient-to-t from-gold-500 to-gold-300 transition-all duration-500"
                          style={{ height: `${h}%` }}
                        />
                        <span className="text-[8px] text-white/30 font-medium">
                          {['CA1', 'CA2', 'CA3', 'Exam', 'Final'][i]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="bg-gradient-to-br from-violet-50 to-white rounded-3xl p-7 border border-violet-100/60 hover:shadow-lg hover:shadow-violet-500/5 transition-all duration-300 h-full flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-violet-600 text-white flex items-center justify-center mb-5">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-display text-lg font-semibold text-gray-900 mb-2">Assignments & Timetables</h3>
              <p className="text-gray-500 text-sm leading-relaxed flex-1">
                Access class schedules, submit assignments online, and never miss a deadline again.
              </p>
            </div>
          </Reveal>

          <Reveal delay={50}>
            <div className="bg-gradient-to-br from-emerald-50 to-white rounded-3xl p-7 border border-emerald-100/60 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 h-full flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-5">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <h3 className="font-display text-lg font-semibold text-gray-900 mb-2">Attendance Tracking</h3>
              <p className="text-gray-500 text-sm leading-relaxed flex-1">
                Monitor daily attendance records and track presence across every term and session.
              </p>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="bg-gradient-to-br from-amber-50 to-white rounded-3xl p-7 border border-amber-100/60 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300 h-full flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center mb-5">
                <Wallet className="w-6 h-6" />
              </div>
              <h3 className="font-display text-lg font-semibold text-gray-900 mb-2">Fee Management</h3>
              <p className="text-gray-500 text-sm leading-relaxed flex-1">
                View fee breakdowns, track payment status, and download receipts — all from one place.
              </p>
            </div>
          </Reveal>

          <Reveal delay={150}>
            <div className="bg-gradient-to-br from-rose-50 to-white rounded-3xl p-7 border border-rose-100/60 hover:shadow-lg hover:shadow-rose-500/5 transition-all duration-300 h-full flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center mb-5">
                <Megaphone className="w-6 h-6" />
              </div>
              <h3 className="font-display text-lg font-semibold text-gray-900 mb-2">Announcements</h3>
              <p className="text-gray-500 text-sm leading-relaxed flex-1">
                Stay informed with school-wide announcements, circulars, and important updates.
              </p>
            </div>
          </Reveal>

          <Reveal delay={200} className="md:col-span-3">
            <div className="bg-gradient-to-r from-gray-50 to-blue-50/50 rounded-3xl p-7 border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center shrink-0">
                <Bell className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-lg font-semibold text-gray-900 mb-1">Real-Time Notifications</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Receive instant alerts for new grades, fee deadlines, and messages from teachers or administrators — never miss an update.
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                {['Grades', 'Fees', 'Messages'].map((tag) => (
                  <span key={tag} className="text-[10px] font-bold text-sky-600 bg-sky-100 px-2.5 py-1 rounded-full uppercase tracking-wide">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
