import { ArrowRight, LogIn, GraduationCap, ClipboardList, BadgeCheck } from 'lucide-react'
import Button from './ui/Button'
import Reveal from './ui/Reveal'

const steps = [
  {
    icon: <GraduationCap className="w-5 h-5" />,
    step: '01',
    title: 'Enquire',
    description: 'Contact us to learn more about the seminary and the boarding experience.',
  },
  {
    icon: <ClipboardList className="w-5 h-5" />,
    step: '02',
    title: 'Apply',
    description: 'Submit your child\'s application and supporting documents to the school.',
  },
  {
    icon: <BadgeCheck className="w-5 h-5" />,
    step: '03',
    title: 'Secure a Place',
    description: 'Complete admission formalities and join the ICS family.',
  },
]

export default function CtaBand() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800">
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-white/10 rounded-full blur-[90px]" />
      <div className="absolute -bottom-32 -right-16 w-80 h-80 bg-blue-400/10 rounded-full blur-[100px]" />
      <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:44px_44px]" />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 py-16 sm:py-20 md:py-24 text-center">
        <Reveal>
          <span className="inline-block text-[11px] font-bold tracking-widest text-blue-100 bg-white/10 px-4 py-1.5 rounded-full uppercase mb-5">
            Admissions Open
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-white leading-tight mb-4">
            Begin Your Journey at ICS
          </h2>
          <p className="text-blue-200/70 text-[15px] sm:text-base leading-relaxed max-w-2xl mx-auto mb-12">
            Give your child the gift of a disciplined, faith-filled education that has shaped
            leaders for over five decades.
          </p>
        </Reveal>

        <Reveal delay={100}>
          <div className="grid sm:grid-cols-3 gap-5 max-w-4xl mx-auto mb-12">
            {steps.map((s) => (
              <div key={s.step} className="relative bg-white/95 backdrop-blur-md rounded-2xl p-6 ring-1 ring-blue-950/10 text-left shadow-lg shadow-blue-950/15">
                <span className="absolute top-5 right-5 text-2xl font-display font-bold text-blue-900/10">
                  {s.step}
                </span>
                <div className="w-10 h-10 rounded-xl bg-blue-800 text-white flex items-center justify-center mb-4">
                  {s.icon}
                </div>
                <h3 className="font-semibold text-blue-950 mb-1.5">{s.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={200}>
          <div className="flex items-center justify-center gap-3 mb-6 text-blue-100/70">
            <span className="h-px w-10 sm:w-16 bg-white/15" />
            <p className="text-sm font-medium">Already have an account? Access the portal.</p>
            <span className="h-px w-10 sm:w-16 bg-white/15" />
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
            <Button
              href="/apply"
              variant="gold"
              size="lg"
              className="w-full sm:w-auto shadow-xl shadow-gold-800/30"
            >
              Start Your Application
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button
              href="/login"
              variant="outline"
              size="lg"
              className="w-full sm:w-auto ring-white/25 text-white bg-white/10 hover:bg-white/15"
            >
              <LogIn className="w-5 h-5" />
              Sign In to the Portal
            </Button>
            <Button
              href="#contact"
              variant="outline"
              size="lg"
              className="w-full sm:w-auto ring-white/25 text-white bg-white/10 hover:bg-white/15"
            >
              Contact Us
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  )
}