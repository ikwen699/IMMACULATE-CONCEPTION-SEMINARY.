import Image from 'next/image'
import { Heart, BookOpen, Shield, Eye } from 'lucide-react'
import { site } from '@/lib/site'
import SectionHeading from './ui/SectionHeading'
import Reveal from './ui/Reveal'

const pillars = [
  {
    icon: <Heart className="w-5 h-5" />,
    title: 'Faith',
    description: 'Rooted in Catholic values, we nurture spiritual growth and moral integrity in every student.',
    color: 'bg-rose-100 text-rose-600',
  },
  {
    icon: <BookOpen className="w-5 h-5" />,
    title: 'Knowledge',
    description: 'A rigorous academic programme designed to develop critical thinking and a love for learning.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: 'Discipline',
    description: 'Building responsible young men through structure, accountability, and personal responsibility.',
    color: 'bg-amber-100 text-amber-600',
  },
]

const benefits = [
  'Catholic boarding environment focused on moral formation',
  'Separate Science and Arts tracks for tailored learning',
  'Experienced teachers committed to each student\'s growth',
  'Safe and structured campus life since 1972',
]

export default function About() {
  return (
    <section id="about" className="relative py-24 md:py-28 bg-white overflow-hidden">
      <div className="absolute -top-40 right-0 w-96 h-96 bg-gold-50 rounded-full blur-[100px]" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 relative">
        <Reveal>
          <SectionHeading
            eyebrow="Our Foundation"
            title="Five Decades of Academic & Moral Excellence"
            sub="For over fifty years, Immaculate Conception Seminary has produced young men of knowledge, faith, and integrity in Cross River State, Nigeria."
          />
        </Reveal>

        <div className="grid md:grid-cols-2 gap-6 mb-14">
          <Reveal delay={100}>
            <div className="bg-gradient-to-br from-blue-50/80 to-white rounded-2xl p-8 border border-blue-100/60 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 h-full">
              <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-5">
                <Heart className="w-5 h-5" />
              </div>
              <h3 className="font-display text-lg font-semibold text-gray-900 mb-3">Our Mission</h3>
              <p className="text-gray-600 text-[15px] leading-relaxed">
                To provide holistic Catholic education rooted in faith, knowledge, and
                discipline, nurturing young men to become responsible, morally upright, and
                intellectually sound leaders in society.
              </p>
            </div>
          </Reveal>
          <Reveal delay={200}>
            <div className="bg-gradient-to-br from-blue-50/80 to-white rounded-2xl p-8 border border-blue-100/60 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 h-full">
              <div className="w-11 h-11 rounded-xl bg-blue-700 text-white flex items-center justify-center mb-5">
                <Eye className="w-5 h-5" />
              </div>
              <h3 className="font-display text-lg font-semibold text-gray-900 mb-3">Our Vision</h3>
              <p className="text-gray-600 text-[15px] leading-relaxed">
                To be a centre of academic excellence and moral formation that empowers
                students to contribute meaningfully to the Church and the world.
              </p>
            </div>
          </Reveal>
        </div>

        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-14 items-center">
          <Reveal>
            <div className="relative">
              <div className="absolute -inset-3 bg-gold-200/40 rounded-3xl rotate-1" />
              <div className="relative rounded-3xl overflow-hidden ring-1 ring-gray-200">
                <Image
                  src={site.images.campus1}
                  alt="Immaculate Conception Seminary campus"
                  width={1080}
                  height={810}
                  className="w-full h-[320px] sm:h-[380px] object-cover"
                />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-blue-950/90 via-blue-950/40 to-transparent p-6 pt-16">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gold-500 text-blue-950 flex items-center justify-center font-display font-bold text-sm">
                      Est.
                      <br />
                      1972
                    </div>
                    <p className="text-sm font-medium text-white/90">
                      Mafamosing, Akampka LGA, Cross River State
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={150}>
            <div className="space-y-7">
              <div>
                <h3 className="font-display text-2xl font-semibold text-gray-900 mb-3">Why Choose ICS?</h3>
                <p className="text-gray-500 text-[15px] leading-relaxed">
                  Established in 1972, the seminary has remained committed to producing
                  well-rounded young men equipped with knowledge, discipline, and a strong
                  moral compass for over five decades.
                </p>
              </div>

              <ul className="space-y-3">
                {benefits.map((b) => (
                  <li key={b} className="flex items-start gap-3">
                    <span className="mt-1 w-5 h-5 rounded-full bg-gold-100 text-gold-600 flex items-center justify-center shrink-0">
                      <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="2 6 5 9 10 3" />
                      </svg>
                    </span>
                    <span className="text-gray-600 text-[15px]">{b}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-2.5 pt-2">
                {pillars.map((p) => (
                  <span
                    key={p.title}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-sm font-medium text-gray-700"
                  >
                    <span className={`w-7 h-7 rounded-lg ${p.color} flex items-center justify-center`}>
                      {p.icon}
                    </span>
                    {p.title}
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
