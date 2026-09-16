import { Quote } from 'lucide-react'

const testimonials = [
  {
    text: 'My experience at this school has been amazing. The teachers are supportive, patient, and always willing to help us understand our lessons. I have grown not only academically but also personally.',
    name: 'Student',
    role: 'Current Student',
  },
  {
    text: 'I am grateful to be part of this school. The learning environment is friendly and encouraging, and the teachers motivate us to always do our best.',
    name: 'Student',
    role: 'Current Student',
  },
  {
    text: 'This school has helped me discover my strengths and build confidence. I have made wonderful friends and learned valuable lessons that I will carry with me into the future.',
    name: 'Student',
    role: 'Current Student',
  },
  {
    text: 'The teachers genuinely care about their students. They encourage us to ask questions, work hard, and believe in ourselves.',
    name: 'Student',
    role: 'Current Student',
  },
  {
    text: 'Choosing this school was one of the best decisions for my education. The combination of good teaching, discipline, and extracurricular activities has made my school experience enjoyable.',
    name: 'Parent',
    role: 'Parent',
  },
]

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-20 md:py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-14">
          <span className="inline-block text-[11px] font-semibold tracking-wide text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full uppercase mb-4">
            Testimonials
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
            What People Say About ICS
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="group relative bg-white rounded-2xl border border-gray-100 p-7 shadow-sm hover:shadow-lg hover:border-blue-100 transition-all duration-300"
            >
              <Quote className="w-8 h-8 text-blue-200 mb-4 transition-colors duration-300 group-hover:text-blue-400" />
              <p className="text-gray-600 text-sm leading-relaxed mb-6 italic">
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
                  {t.name === 'Student' ? 'S' : 'P'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
