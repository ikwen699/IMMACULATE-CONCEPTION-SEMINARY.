'use client'

import { Quote, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import SectionHeading from './ui/SectionHeading'
import Reveal from './ui/Reveal'

const testimonials = [
  {
    title: 'My Child Found More Than a School — They Found a Place to Belong.',
    text: "As a parent, I wanted more than good grades for my child. I wanted a school that would build character, confidence, discipline, and a genuine love for learning. This school has exceeded our expectations. I have watched my child grow from being uncertain and reserved into someone who believes in their abilities and dreams boldly. That transformation means everything to us.",
    name: 'Mrs. Grace',
    role: 'Parent',
  },
  {
    title: 'This School Made Me Believe I Could Become More.',
    text: "I used to think school was just about passing exams. Here, I learned that education is about discovering your strengths, challenging yourself, and preparing for the future. My teachers believed in me even when I doubted myself. I've gained knowledge, confidence, friendships, and memories that I will carry with me for the rest of my life.",
    name: 'Prosper',
    role: 'Current Student',
  },
  {
    title: 'Teaching Here Feels Like Making a Difference Every Day.',
    text: "What makes this school special is its commitment to every student. We are not simply teaching subjects; we are helping young people discover who they are and what they can become. The support, creativity, and collaboration among staff create an environment where both teachers and students can thrive. It is incredibly rewarding to watch a student overcome a challenge and realize, 'I can do this.'",
    name: 'Mr. Basil',
    role: 'Teacher',
  },
  {
    title: 'I Left With More Than a Certificate — I Left With Confidence.',
    text: "Years after graduating, I still find myself using the lessons this school taught me. The discipline, leadership, resilience, and confidence I developed here have shaped the person I am today. My time at this school prepared me not only for university and a career, but for life. I will always be proud to call myself a graduate.",
    name: 'Hon. Dr. Goodluck Ikwen',
    role: 'Alumni',
  },
  {
    title: "We Don't Just Educate Students. We Prepare Them for Life.",
    text: "Every child who walks through our doors carries a unique potential. Our responsibility is to recognize it, nurture it, challenge it, and give it room to grow. We measure our success not only by academic results, but by the confident, compassionate, capable young people our students become. That is the legacy we are committed to building.",
    name: 'Rev. Fr. Peter',
    role: 'School Administrator',
  },
]

const avatarGradients = [
  'from-blue-500 to-blue-700',
  'from-emerald-500 to-emerald-700',
  'from-violet-500 to-violet-700',
  'from-rose-500 to-rose-700',
  'from-gold-400 to-gold-600',
]

const AVATAR_INITIAL_SKIP = new Set(['mr', 'mrs', 'ms', 'miss', 'rev', 'fr', 'hon', 'dr', 'sir', 'madam'])

function getAvatarInitial(name: string): string {
  if (!name) return '?'
  const word = name
    .split(' ')
    .find((w) => !AVATAR_INITIAL_SKIP.has(w.replace(/[^a-z]/gi, '').toLowerCase()))
  return (word || name).charAt(0).toUpperCase()
}

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
                <h3 className="font-display text-lg font-semibold text-gray-900 leading-snug mb-3">
                  &ldquo;{t.title}&rdquo;
                </h3>
                <p className="text-gray-600 text-[15px] leading-relaxed italic flex-1">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-5 mt-5 border-t border-gray-100">
                  <div className={cn('w-10 h-10 rounded-full bg-gradient-to-br text-white flex items-center justify-center font-bold text-sm shrink-0', avatarGradients[i % avatarGradients.length])}>
                    {getAvatarInitial(t.name)}
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