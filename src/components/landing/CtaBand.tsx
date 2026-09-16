import { ArrowRight, GraduationCap, ClipboardList, BadgeCheck } from 'lucide-react'
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
    <section className="relative overflow-hidden bg-gradient-to-br from-gold-300 via-gold-400 to-gold-600">
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-white/20 rounded-full blur-[90px]" />
      <div className="absolute -bottom-32 -right-16 w-80 h-80 bg-blue-950/20 rounded-full blur-[100px]" />
      <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(to_right,#1e1b0e_1px,transparent_1px),linear-gradient(to_bottom,#1e1b0e_1px,transparent_1px)] bg-[size:44px_44px]" />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 py-20 md:py-24 text-center">
        <Reveal>
          <span className="inline-block text-[11px] font-bold tracking-widest text-blue-950 bg-blue-950/10 px-4 py-1.5 rounded-full uppercase mb-5">
            Admissions Open
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-blue-950 leading-tight mb-4">
            Begin Your Journey at ICS
          </h2>
          <p className="text-blue-950/70 text-[15px] sm:text-base leading-relaxed max-w-2xl mx-auto mb-12">
            Give your child the gift of a disciplined, faith-filled education that has shaped
            leaders for over five decades.
          </p>
        </Reveal>

        <Reveal delay={100}>
          <div className="grid sm:grid-cols-3 gap-5 max-w-4xl mx-auto mb-12">
            {steps.map((s) => (
              <div key={s.step} className="relative bg-white/70 backdrop-blur-md rounded-2xl p-6 ring-1 ring-blue-950/5 text-left shadow-lg shadow-gold-600/10">
                <span className="absolute top-5 right-5 text-2xl font-display font-bold text-gold-600/30">
                  {s.step}
                </span>
                <div className="w-10 h-10 rounded-xl bg-blue-950 text-gold-300 flex items-center justify-center mb-4">
                  {s.icon}
                </div>
                <h3 className="font-semibold text-blue-950 mb-1.5">{s.title}</h3>
                <p className="text-sm text-blue-950/60 leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={200}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              href="/register"
              variant="primary"
              size="lg"
              className="bg-blue-950 text-white hover:bg-blue-900 shadow-xl shadow-blue-950/30"
            >
              Start Your Application
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button
              href="#contact"
              variant="outline"
              size="lg"
              className="ring-blue-950/20 text-blue-950 bg-white/60 hover:bg-white"
            >
              Contact Us
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  )
}