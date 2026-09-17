'use client'

import { Quote, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import SectionHeading from './ui/SectionHeading'
import Reveal from './ui/Reveal'

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

const avatarGradients = [
  'from-blue-500 to-blue-700',
  'from-emerald-500 to-emerald-700',
  'from-violet-500 to-violet-700',
  'from-rose-500 to-rose-700',
  'from-gold-400 to-gold-600',
]

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-20 sm:py-24 md:py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="Testimonials"
            title="What People Say About ICS"
            sub="Hear from the students and parents who experience life at the seminary every day."
          />
        </Reveal>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal
              key={i}
              delay={i * 75}
              className={cn(i === testimonials.length - 1 && 'md:col-span-2 lg:col-span-1')}
            >
              <div className="bg-white rounded-2xl border border-gray-100 p-7 shadow-sm hover:shadow-lg hover:border-blue-100 transition-all duration-300 flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <Quote className="w-7 h-7 text-gold-300" />
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star key={s} className="w-3.5 h-3.5 text-gold-400 fill-gold-400" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 text-[15px] leading-relaxed italic flex-1">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-5 mt-5 border-t border-gray-100">
                  <div className={cn('w-10 h-10 rounded-full bg-gradient-to-br text-white flex items-center justify-center font-bold text-sm shrink-0', avatarGradients[i % avatarGradients.length])}>
                    {t.name === 'Student' ? 'S' : 'P'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}