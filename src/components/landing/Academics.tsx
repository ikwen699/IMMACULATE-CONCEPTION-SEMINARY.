'use client'

import { useState, useCallback, useRef } from 'react'
import { BookMarked, FlaskConical, Globe2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import SectionHeading from './ui/SectionHeading'
import Reveal from './ui/Reveal'

const tabs = [
  {
    id: 'jss',
    label: 'Junior Secondary',
    short: 'Junior',
    sublabel: 'JSS 1 – 3',
    icon: <BookMarked className="w-4 h-4" />,
    color: 'bg-blue-600',
    badgeColor: 'bg-blue-100 text-blue-700',
    dotColor: 'bg-blue-400',
    description: 'A broad foundation programme preparing students for senior-level academics through a balanced mix of sciences, humanities, and creative arts.',
    subjects: [
      'Mathematics',
      'English Language',
      'Basic Science & Technology',
      'Christian Religious Studies',
      'Social Studies',
      'Civic Education',
      'French Language',
      'Agricultural Science',
      'Home Economics',
      'Physical & Health Education',
      'Fine Arts',
      'Music',
    ],
  },
  {
    id: 'science',
    label: 'SS Science',
    short: 'Science',
    sublabel: 'SS 1 – 3',
    icon: <FlaskConical className="w-4 h-4" />,
    color: 'bg-blue-800',
    badgeColor: 'bg-blue-50 text-blue-700',
    dotColor: 'bg-blue-500',
    description: 'A rigorous science-track programme equipping students with deep knowledge in STEM disciplines for university placement and future careers.',
    subjects: [
      'Mathematics',
      'English Language',
      'Physics',
      'Chemistry',
      'Biology',
      'Further Mathematics',
      'Agricultural Science',
      'Computer Studies',
      'Christian Religious Studies',
    ],
  },
  {
    id: 'arts',
    label: 'SS Arts',
    short: 'Arts',
    sublabel: 'SS 1 – 3',
    icon: <Globe2 className="w-4 h-4" />,
    color: 'bg-blue-700',
    badgeColor: 'bg-blue-100 text-blue-800',
    dotColor: 'bg-blue-600',
    description: 'An enriching arts-track programme fostering critical thinking through literature, social sciences, and creative disciplines.',
    subjects: [
      'Literature in English',
      'Government',
      'Christian Religious Studies',
      'History',
      'French Language',
      'Fine Arts',
      'Economics',
      'Civic Education',
    ],
  },
]

export default function Academics() {
  const [active, setActive] = useState(0)
  const tabListRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      setActive((prev) => (prev + 1) % tabs.length)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      setActive((prev) => (prev - 1 + tabs.length) % tabs.length)
    }
  }, [])

  const tab = tabs[active]

  return (
    <section id="academics" className="py-20 sm:py-24 md:py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="Academic Programmes"
            title="Building a Strong Academic Foundation"
            sub="Our curriculum covers Junior Secondary and Senior Secondary, offering Science and Arts tracks to suit every student's strengths and ambitions."
          />
        </Reveal>

        <Reveal delay={100}>
          <div className="flex flex-col items-center">
            <div
              ref={tabListRef}
              role="tablist"
              aria-label="Academic programmes"
              onKeyDown={handleKeyDown}
              className="flex flex-wrap justify-center bg-white rounded-2xl p-1.5 ring-1 ring-gray-200 shadow-sm mb-8"
            >
              {tabs.map((t, i) => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={active === i}
                  aria-controls={`panel-${t.id}`}
                  id={`tab-${t.id}`}
                  onClick={() => setActive(i)}
                  className={cn(
                    'relative flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
                    active === i
                      ? 'bg-blue-800 text-white shadow-md shadow-blue-800/25'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  )}
                >
                  {t.icon}
                  <span className="hidden sm:inline">{t.label}</span>
                  <span className="sm:hidden">{t.short}</span>
                </button>
              ))}
            </div>

            <div
              role="tabpanel"
              id={`panel-${tab.id}`}
              aria-labelledby={`tab-${tab.id}`}
              className="w-full animate-fade-in"
            >
              <div className="max-w-2xl mx-auto text-center mb-8">
                <span className={cn('inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full mb-3', tab.badgeColor)}>
                  {tab.sublabel}
                </span>
                <p className="text-gray-500 text-[15px] leading-relaxed">{tab.description}</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                {tab.subjects.map((s) => (
                  <div
                    key={s}
                    className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 ring-1 ring-gray-100 hover:ring-gray-200 hover:shadow-sm transition-all duration-200"
                  >
                    <span className={cn('w-2 h-2 rounded-full shrink-0', tab.dotColor)} />
                    <span className="text-sm font-medium text-gray-700">{s}</span>
                  </div>
                ))}
              </div>

              <p className="text-center text-xs text-gray-400 mt-6 font-medium">
                {tab.subjects.length} subjects offered
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
