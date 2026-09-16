'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import SectionHeading from './ui/SectionHeading'
import Reveal from './ui/Reveal'

const faqs = [
  {
    q: 'How do I get access to the portal?',
    a: 'Accounts are created through the school. You can register on the portal, after which your account is reviewed and approved by an administrator before you can sign in.',
  },
  {
    q: 'What class levels does the seminary offer?',
    a: 'We operate from Junior Secondary School (JSS 1–3) through Senior Secondary School (SS 1–3), with both Science and Arts tracks at the senior level.',
  },
  {
    q: 'How are school fees paid and tracked?',
    a: 'Fees are managed through the portal under the Fee Management section. Payments can be submitted and reviewed through an approval workflow, and receipts are available for download.',
  },
  {
    q: 'Can parents monitor their child\'s progress?',
    a: 'Yes. Parents receive accounts that allow them to view their children\'s academic records, grades, attendance, and fee status in real time.',
  },
  {
    q: 'How do I transfer a student to ICS?',
    a: 'Transfer inquiries are handled by the school administration. Please contact us by phone or email and our team will guide you through the admission process.',
  },
  {
    q: 'Is boarding accommodation available?',
    a: 'Yes. The seminary provides a structured Catholic boarding environment where students grow in faith, discipline, and independence together.',
  },
]

export default function Faq() {
  const [open, setOpen] = useState(0)

  return (
    <section id="faq" className="py-20 sm:py-24 md:py-28 bg-white">
      <div className="max-w-3xl mx-auto px-5 sm:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="FAQ"
            title="Frequently Asked Questions"
            sub="Answers to the questions families ask us most about life at the seminary and the school portal."
          />
        </Reveal>

        <div className="space-y-3">
          {faqs.map((f, i) => {
            const isOpen = open === i
            return (
              <Reveal key={i} delay={i * 60}>
                <div
                  className={cn(
                    'rounded-2xl border transition-all duration-300',
                    isOpen
                      ? 'border-gold-300 bg-gold-50/50 shadow-sm'
                      : 'border-gray-100 bg-gray-50/50 hover:border-gray-200'
                  )}
                >
                  <button
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${i}`}
                    className="flex items-center justify-between w-full px-6 py-4 text-left"
                  >
                    <span className="text-[15px] font-semibold text-gray-900 pr-4">{f.q}</span>
                    <span
                      className={cn(
                        'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300',
                        isOpen ? 'bg-gold-500 text-blue-950 rotate-180' : 'bg-white text-gray-400 ring-1 ring-gray-200'
                      )}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </span>
                  </button>
                  <div
                    id={`faq-panel-${i}`}
                    role="region"
                    className={cn(
                      'grid transition-all duration-300 ease-in-out',
                      isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    )}
                  >
                    <div className="overflow-hidden">
                      <p className="px-6 pb-5 text-gray-600 text-sm leading-relaxed">{f.a}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}