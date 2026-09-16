import { Heart, BookOpen, Shield } from 'lucide-react'

const pillars = [
  {
    icon: <Heart className="w-6 h-6" />,
    title: 'Faith',
    description:
      'Rooted in Catholic values, we nurture spiritual growth and moral integrity in every student.',
  },
  {
    icon: <BookOpen className="w-6 h-6" />,
    title: 'Knowledge',
    description:
      'A rigorous academic programme designed to develop critical thinking and a love for learning.',
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Discipline',
    description:
      'Building responsible young men through structure, accountability, and personal responsibility.',
  },
]

export default function About() {
  return (
    <section id="about" className="relative py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-14">
          <span className="inline-block text-[11px] font-semibold tracking-wide text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full uppercase mb-4">
            About Us
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
            Five Decades of Academic Excellence
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start mb-16">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Our Mission</h3>
              <p className="text-gray-600 leading-relaxed">
                To provide holistic Catholic education rooted in faith, knowledge, and
                discipline, nurturing young men to become responsible, morally upright, and
                intellectually sound leaders in society.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Our Vision</h3>
              <p className="text-gray-600 leading-relaxed">
                To be a centre of academic excellence and moral formation that empowers
                students to contribute meaningfully to the Church and the world.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-8 md:p-10 border border-blue-100">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                <span className="font-bold text-sm">1972</span>
              </div>
              <p className="text-sm font-semibold text-blue-700">Founded in Mafamosing</p>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              Immaculate Conception Seminary was established in 1972 in Mafamosing, Akampka
              Local Government Area, Cross River State, Nigeria. For over five decades, the
              seminary has remained committed to producing well-rounded young men equipped
              with knowledge, discipline, and a strong moral compass.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Operating from Junior Secondary School (JSS 1–3) through Senior Secondary
              School (SS 1–3), the seminary provides a Catholic boarding environment that
              blends rigorous academics with spiritual formation and extracurricular
              enrichment.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {pillars.map((p) => (
            <div
              key={p.title}
              className="group text-center p-7 rounded-2xl border border-gray-100 bg-gray-50/60 hover:bg-white hover:shadow-lg hover:shadow-blue-500/5 hover:border-blue-100 transition-all duration-300"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 text-blue-700 mb-4 transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-105">
                {p.icon}
              </div>
              <h4 className="font-bold text-gray-900 mb-2">{p.title}</h4>
              <p className="text-sm text-gray-500 leading-relaxed">{p.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
