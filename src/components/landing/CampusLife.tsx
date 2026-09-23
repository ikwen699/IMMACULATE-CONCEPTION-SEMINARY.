import Image from 'next/image'
import { Church, Trophy, Users, Home, Images, Plus } from 'lucide-react'
import { site } from '@/lib/site'
import SectionHeading from './ui/SectionHeading'
import Reveal from './ui/Reveal'

const activities = [
  {
    icon: <Church className="w-5 h-5" />,
    title: 'Spiritual Life',
    description: 'Daily prayers, mass, and retreats that deepen faith and character in every student.',
    color: 'bg-blue-100 text-blue-700',
    bg: 'bg-gradient-to-br from-blue-950 to-blue-900',
  },
  {
    icon: <Trophy className="w-5 h-5" />,
    title: 'Sports & Athletics',
    description: 'Football, athletics, and inter-house competitions that build teamwork and resilience.',
    color: 'bg-blue-100 text-blue-700',
    bg: 'bg-gradient-to-br from-blue-900 to-blue-800',
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: 'Clubs & Societies',
    description: 'Debate, science, literary, and cultural clubs that spark curiosity and leadership.',
    color: 'bg-blue-100 text-blue-800',
    bg: 'bg-gradient-to-br from-blue-800 to-blue-700',
  },
  {
    icon: <Home className="w-5 h-5" />,
    title: 'Boarding Life',
    description: 'A structured Catholic boarding experience that fosters independence and strong bonds.',
    color: 'bg-blue-100 text-blue-700',
    bg: 'bg-gradient-to-br from-blue-950 to-blue-900',
  },
]

export default function CampusLife() {
  return (
    <section id="campus-life" className="py-20 sm:py-24 md:py-28 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="Campus Life"
            title="Beyond the Classroom"
            sub="At ICS, learning extends well beyond academics. Students grow through faith, sport, creativity, and the shared life of the seminary."
          />
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
          {activities.map((a, i) => (
            <Reveal key={a.title} delay={i * 80}>
              <div className={`group relative ${a.bg} rounded-3xl p-7 h-full overflow-hidden hover:-translate-y-1 transition-all duration-300`}>
                <div className="absolute -top-10 -right-10 w-28 h-28 bg-white/5 rounded-full blur-2xl" />
                <div className={`w-11 h-11 rounded-xl ${a.color} flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110`}>
                  {a.icon}
                </div>
                <h3 className="font-display text-lg font-semibold text-white mb-2">{a.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{a.description}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="flex items-center gap-3 mb-8">
            <span className="inline-flex items-center gap-2 text-[11px] font-bold text-blue-700 bg-blue-50 px-4 py-1.5 rounded-full ring-1 ring-blue-200 uppercase">
              <Images className="w-3.5 h-3.5" />
              A Glimpse of Our Seminary
            </span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>
        </Reveal>

        <div className="grid md:grid-cols-3 grid-rows-2 gap-5">
          <Reveal className="md:row-span-2">
            <div className="relative h-full min-h-[320px] rounded-3xl overflow-hidden group ring-1 ring-gray-100">
              <Image
                src={site.images.campus1}
                alt="ICS campus building"
                width={1080}
                height={810}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-950/70 via-transparent to-transparent" />
              <div className="absolute bottom-0 p-6">
                <span className="text-[10px] font-bold text-blue-100 uppercase tracking-widest">Est. 1972</span>
                <p className="text-white font-semibold mt-1">The seminary grounds</p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="relative rounded-3xl overflow-hidden group ring-1 ring-gray-100">
              <Image
                src={site.images.campus2}
                alt="ICS campus life"
                width={960}
                height={540}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-950/60 via-transparent to-transparent" />
              <div className="absolute bottom-0 p-5">
                <p className="text-white font-semibold text-sm">Life at the seminary</p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={200}>
            <div className="relative h-full min-h-[200px] rounded-3xl overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100/50 border border-dashed border-gray-200 flex items-center justify-center group">
              <div className="text-center px-6">
                <div className="w-12 h-12 rounded-2xl bg-white ring-1 ring-gray-200 flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Plus className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-500">More campus photos</p>
                <p className="text-xs text-gray-400 mt-1">coming soon</p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}