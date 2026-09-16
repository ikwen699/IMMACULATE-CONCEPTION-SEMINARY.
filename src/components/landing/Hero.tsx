import Image from 'next/image'
import {
  ArrowRight,
  LogIn,
  Users,
  BookOpen,
  School,
  CalendarDays,
  Bell,
  TrendingUp,
  BarChart3,
} from 'lucide-react'
import { site } from '@/lib/site'
import StatCounter from './ui/StatCounter'
import Button from './ui/Button'

const stats = [
  { end: 500, suffix: '+', label: 'Students', icon: <Users className="w-5 h-5" /> },
  { end: 35, suffix: '+', label: 'Teachers', icon: <BookOpen className="w-5 h-5" /> },
  { end: 18, suffix: '', label: 'Classes', icon: <School className="w-5 h-5" /> },
  { end: 54, suffix: '', label: 'Years', icon: <CalendarDays className="w-5 h-5" /> },
]

const barHeights = [55, 72, 88, 63, 95, 78, 85]

export default function Hero({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800">
      <div className="absolute -top-32 -left-32 w-[28rem] h-[28rem] bg-blue-500/15 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 right-0 w-[24rem] h-[24rem] bg-sky-400/15 rounded-full blur-[100px]" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[32rem] h-[32rem] bg-gold-400/8 rounded-full blur-[120px]" />
      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.3)_100%)]" />

      <div className="relative w-full max-w-7xl mx-auto px-5 sm:px-8 pt-28 pb-20 md:pt-32 md:pb-28 animate-fade-in">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-14 lg:gap-10 items-center">
          <div className="text-center lg:text-left">
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 mb-6">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-gold-300 bg-gold-400/10 px-3.5 py-1.5 rounded-full ring-1 ring-gold-400/20 uppercase">
                Est. {site.established}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-blue-100 bg-white/10 px-3.5 py-1.5 rounded-full ring-1 ring-white/15 uppercase">
                All-Boys Seminary
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-[3.5rem] font-semibold text-white leading-[1.08] tracking-tight mb-4">
              Immaculate
              <br />
              Conception
              <span className="block text-sm sm:text-base font-bold text-gold-300 tracking-[0.3em] mt-3 uppercase">
                Seminary
              </span>
            </h1>

            <div className="w-16 h-px bg-gold-400 mx-auto lg:mx-0 mb-5" />

            <p className="font-display italic text-blue-100/80 text-lg mb-1">
              {site.motto}
            </p>
            <p className="text-blue-200/50 text-sm mb-7">
              {site.mottoTranslation}
            </p>

            <p className="text-blue-100/65 text-[15px] leading-relaxed max-w-md mx-auto lg:mx-0 mb-9">
              Shaping minds, nurturing faith, and building character for over five decades
              in the heart of Cross River State.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 mb-12">
              {isAuthenticated ? (
                <Button href="/dashboard" variant="primary" size="lg">
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5" />
                </Button>
              ) : (
                <>
                  <Button href="/login" variant="primary" size="lg" className="bg-white text-blue-950 hover:bg-blue-50 shadow-white/20">
                    <LogIn className="w-5 h-5" />
                    Sign In
                  </Button>
                  <Button href="/register" variant="gold" size="lg">
                    Register
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </>
              )}
            </div>

            <div className="grid grid-cols-4 gap-4 sm:gap-6 border-t border-white/[0.08] pt-8 max-w-md mx-auto lg:mx-0">
              {stats.map((s) => (
                <StatCounter
                  key={s.label}
                  end={s.end}
                  suffix={s.suffix}
                  label={s.label}
                  icon={s.icon}
                />
              ))}
            </div>
          </div>

          <div className="relative mt-8 lg:mt-0 flex justify-center">
            <div className="absolute -inset-8 bg-blue-500/20 blur-[80px] rounded-full" />

            <div className="relative w-full max-w-md">
              <div className="absolute -top-6 -right-3 sm:-right-8 z-10 rotate-2 animate-float-slow">
                <div className="w-52 sm:w-64 rounded-2xl overflow-hidden ring-1 ring-white/20 shadow-2xl shadow-black/20">
                  <Image
                    src={site.images.heroPhoto}
                    alt="Campus view"
                    width={480}
                    height={270}
                    className="w-full h-32 sm:h-40 object-cover"
                    priority
                  />
                  <div className="px-3.5 py-2.5 bg-blue-950/90 backdrop-blur-sm border-t border-white/10 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-800 ring-1 ring-white/20" />
                    <div>
                      <p className="text-[10px] font-bold text-white/90 leading-tight">Our Campus</p>
                      <p className="text-[9px] text-blue-300/60">Mafamosing, Cross River</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative rounded-2xl border border-white/15 bg-blue-950/60 backdrop-blur-xl shadow-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08] bg-white/[0.03]">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <span className="text-[10px] text-white/30 font-medium bg-white/[0.05] px-3 py-0.5 rounded-md">
                      ics.portal/dashboard
                    </span>
                  </div>
                </div>

                <div className="p-5 sm:p-6 space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center text-white text-sm font-bold ring-2 ring-blue-500/30">
                      A
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white/90">Good morning, Student</p>
                      <p className="text-[11px] text-blue-300/50">Welcome back to your portal</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-1 bg-white/[0.05] rounded-xl px-3.5 py-2.5 ring-1 ring-white/[0.08]">
                      <div className="flex items-center gap-1.5 mb-1">
                        <TrendingUp className="w-3 h-3 text-gold-400" />
                        <span className="text-[10px] font-bold text-gold-300 uppercase tracking-wide">GPA</span>
                      </div>
                      <p className="text-xl font-bold text-white">4.2</p>
                    </div>
                    <div className="flex-1 bg-white/[0.05] rounded-xl px-3.5 py-2.5 ring-1 ring-white/[0.08]">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Bell className="w-3 h-3 text-emerald-400" />
                        <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wide">Attendance</span>
                      </div>
                      <p className="text-xl font-bold text-white">98%</p>
                    </div>
                  </div>

                  <div className="bg-white/[0.03] rounded-xl p-3.5 ring-1 ring-white/[0.06]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold text-white/50 uppercase tracking-wide">Weekly Progress</span>
                      <BarChart3 className="w-3.5 h-3.5 text-blue-400/50" />
                    </div>
                    <div className="flex items-end justify-between gap-1.5 h-16">
                      {barHeights.map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div
                            className="w-full rounded-t-sm transition-all"
                            style={{
                              height: `${h}%`,
                              background: i === 4 ? 'linear-gradient(to top, #d0ab4a, #c19a36)' : 'linear-gradient(to top, rgba(255,255,255,0.15), rgba(255,255,255,0.05))',
                            }}
                          />
                          <span className="text-[8px] text-white/30 font-medium">
                            {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {[
                      { subject: 'English Language', score: 92, color: 'bg-emerald-400' },
                      { subject: 'Mathematics', score: 78, color: 'bg-blue-400' },
                      { subject: 'Physics', score: 85, color: 'bg-gold-400' },
                    ].map((g) => (
                      <div key={g.subject} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
                          <BookOpen className="w-3 h-3 text-white/40" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between mb-1">
                            <span className="text-[11px] font-medium text-white/70 truncate">{g.subject}</span>
                            <span className="text-[11px] font-bold text-white/90 ml-2">{g.score}%</span>
                          </div>
                          <div className="h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${g.color}`} style={{ width: `${g.score}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-5 -left-3 sm:-left-8 z-10 -rotate-1 animate-float">
                <div className="flex items-center gap-2.5 bg-white/[0.12] backdrop-blur-xl ring-1 ring-white/20 rounded-2xl px-4 py-2.5 shadow-xl">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-white/90">New grade uploaded</p>
                    <p className="text-[10px] text-blue-200/50">Mathematics — 82%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
