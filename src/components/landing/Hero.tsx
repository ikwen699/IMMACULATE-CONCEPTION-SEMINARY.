import Link from 'next/link'
import { ArrowRight, LogIn, Users, BookOpen, School, CalendarDays } from 'lucide-react'

const stats = [
  { icon: <Users className="w-5 h-5" />, value: '500+', label: 'Students' },
  { icon: <BookOpen className="w-5 h-5" />, value: '35+', label: 'Teachers' },
  { icon: <School className="w-5 h-5" />, value: '18', label: 'Classes' },
  { icon: <CalendarDays className="w-5 h-5" />, value: '54', label: 'Years' },
]

export default function Hero({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800">
      <div className="absolute -top-32 -left-32 w-[28rem] h-[28rem] bg-blue-500/15 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 right-0 w-[24rem] h-[24rem] bg-sky-400/15 rounded-full blur-[100px]" />
      <div className="absolute top-1/3 left-1/2 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.3)_100%)]" />

      <div className="relative w-full max-w-7xl mx-auto px-5 sm:px-8 pt-28 pb-20 md:pt-32 md:pb-28 animate-fade-in">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative inline-block mb-8">
            <div className="absolute inset-0 rounded-full bg-blue-400/25 blur-xl scale-110" />
            <img
              src="/school-badge.jpg"
              alt="ICS School Badge"
              className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full object-cover ring-[3px] ring-white/30 shadow-[0_0_40px_rgba(255,255,255,0.15)]"
            />
            <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/20" />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-blue-100 bg-white/10 px-3.5 py-1.5 rounded-full backdrop-blur-md ring-1 ring-white/15 uppercase">
              Est. 1972
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-blue-100 bg-white/10 px-3.5 py-1.5 rounded-full backdrop-blur-md ring-1 ring-white/15 uppercase">
              All-Boys Seminary
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-wide mb-4">
            IMMACULATE CONCEPTION
            <span className="block text-lg sm:text-xl font-semibold text-blue-200/90 tracking-[0.2em] mt-2 uppercase">
              Seminary
            </span>
          </h1>

          <p className="text-blue-200/70 italic text-lg sm:text-xl mb-2 font-medium">
            Scientia caritas iustitia
          </p>
          <p className="text-blue-200/50 text-sm mb-8">
            Knowledge · Charity · Justice
          </p>

          <p className="text-blue-100/70 text-base sm:text-lg leading-relaxed max-w-xl mx-auto mb-10">
            Shaping minds, nurturing faith, and building character for over five decades
            in the heart of Cross River State.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="group inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-white text-blue-900 font-semibold text-[15px] hover:bg-blue-50 transition-all duration-200 shadow-xl shadow-black/10 active:scale-[0.98]"
              >
                Go to Dashboard
                <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="group inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-white text-blue-900 font-semibold text-[15px] hover:bg-blue-50 transition-all duration-200 shadow-xl shadow-black/10 active:scale-[0.98]"
                >
                  <LogIn className="w-5 h-5" />
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-white/10 text-white font-semibold text-[15px] ring-1 ring-white/20 hover:bg-white/15 backdrop-blur-md transition-all duration-200 active:scale-[0.98]"
                >
                  Create Account
                  <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 max-w-lg mx-auto">
            {stats.map((s) => (
              <div key={s.label} className="text-center group">
                <div className="flex items-center justify-center w-10 h-10 mx-auto rounded-xl bg-white/10 ring-1 ring-white/20 text-blue-100 mb-2.5 transition-all duration-300 group-hover:bg-white/15 group-hover:ring-white/30 group-hover:scale-105">
                  {s.icon}
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-white">{s.value}</p>
                <p className="text-xs text-blue-200/60 mt-0.5 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
