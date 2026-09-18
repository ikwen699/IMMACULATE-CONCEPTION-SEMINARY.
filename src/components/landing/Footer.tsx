'use client'

import { useState, useEffect } from 'react'
import { MapPin, Phone, Mail, Send, ArrowUp, ExternalLink, CheckCircle2 } from 'lucide-react'
import { site } from '@/lib/site'

function FacebookIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z" />
    </svg>
  )
}

function TwitterIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.162a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  )
}

function YoutubeIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

const quickLinks = [
  { label: 'About Us', href: '#about' },
  { label: 'Academics', href: '#academics' },
  { label: 'Portal Features', href: '#features' },
  { label: 'Campus Life', href: '#campus-life' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Sign In to Portal', href: '/login' },
  { label: 'Apply for Admission', href: '/apply' },
]

const programmes = [
  { label: 'Junior Secondary (JSS 1–3)', href: '#academics' },
  { label: 'Senior Secondary — Science', href: '#academics' },
  { label: 'Senior Secondary — Arts', href: '#academics' },
  { label: 'Boarding Life', href: '#campus-life' },
]

const socialIcons = [
  { name: 'Facebook', icon: <FacebookIcon />, url: 'https://facebook.com' },
  { name: 'Twitter', icon: <TwitterIcon />, url: 'https://twitter.com' },
  { name: 'Instagram', icon: <InstagramIcon />, url: 'https://instagram.com' },
  { name: 'YouTube', icon: <YoutubeIcon />, url: 'https://youtube.com' },
]

export default function Footer() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    if (!subscribed) return
    const t = setTimeout(() => setSubscribed(false), 4000)
    return () => clearTimeout(t)
  }, [subscribed])

  return (
    <footer id="contact" className="bg-blue-950 text-white">
      <div className="border-t-4 border-gold-500/80" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16 md:py-20">
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-10 items-center mb-14 rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.07] p-8 sm:p-10">
          <div>
            <h3 className="font-display text-2xl font-semibold text-white mb-2">Stay Updated</h3>
            <p className="text-blue-200/60 text-sm leading-relaxed">
              Get the latest announcements, term dates, and school news delivered to your inbox.
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (email.trim()) setSubscribed(true)
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="flex-1">
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <input
                id="newsletter-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 rounded-xl bg-white/[0.06] ring-1 ring-white/15 text-white placeholder-blue-200/40 outline-none transition-all focus:bg-white/[0.09] focus:ring-gold-400/60"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gold-500 text-blue-950 text-sm font-semibold hover:bg-gold-400 transition-colors shadow-lg shadow-gold-500/20"
            >
              {subscribed ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Subscribed
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Subscribe
                </>
              )}
            </button>
          </form>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr] gap-10 lg:gap-8 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <img
                src={site.images.badge}
                alt="ICS Badge"
                className="w-11 h-11 rounded-full object-cover ring-2 ring-white/20"
              />
              <div>
                <p className="font-display font-semibold text-white text-sm tracking-wide">
                  Immaculate Conception
                </p>
                <p className="text-[10px] font-bold text-gold-300 tracking-[0.2em] uppercase">
                  Seminary
                </p>
              </div>
            </div>
            <p className="font-display italic text-blue-200/70 text-sm mb-3">{site.motto}</p>
            <p className="text-sm text-blue-200/50 leading-relaxed mb-6">
              Shaping minds, nurturing faith, and building character for over five decades in
              Cross River State, Nigeria.
            </p>
            <div className="flex gap-2.5">
              {socialIcons.map((s) => (
                <a
                  key={s.name}
                  href={s.url}
                  aria-label={s.name}
                  className="w-9 h-9 rounded-xl bg-white/[0.06] ring-1 ring-white/10 flex items-center justify-center text-blue-200/70 hover:text-gold-300 hover:ring-gold-400/40 hover:bg-white/[0.1] transition-all duration-200"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-white mb-5 text-sm uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="text-sm text-blue-200/60 hover:text-white transition-colors inline-flex items-center gap-1.5 py-1.5"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-5 text-sm uppercase tracking-wider">Programmes</h4>
            <ul className="space-y-3">
              {programmes.map((p) => (
                <li key={p.label}>
                  <a
                    href={p.href}
                    className="text-sm text-blue-200/60 hover:text-white transition-colors inline-flex items-center gap-1.5 py-1.5"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {p.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-5 text-sm uppercase tracking-wider">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gold-300 mt-0.5 shrink-0" />
                <span className="text-sm text-blue-200/60 leading-relaxed">
                  Mafamosing, Akampka Local Government Area,
                  <br />
                  Cross River State, Nigeria
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gold-300 shrink-0" />
                <a href={site.phoneHref} className="text-sm text-blue-200/60 hover:text-white transition-colors py-1.5 inline-flex items-center">
                  {site.phone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gold-300 shrink-0" />
                <a href={site.emailHref} className="text-sm text-blue-200/60 hover:text-white transition-colors break-all py-1.5 inline-flex items-start">
                  {site.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-blue-200/40">
            &copy; {new Date().getFullYear()} Immaculate Conception Seminary. All rights reserved.
          </p>
          <a
            href="#"
            className="inline-flex items-center gap-2 text-xs font-medium text-blue-200/50 hover:text-gold-300 transition-colors py-1.5"
          >
            <ArrowUp className="w-3.5 h-3.5" />
            Back to top
          </a>
          <p className="text-xs text-blue-200/30">
            Powered by the ICS School Portal
          </p>
        </div>
      </div>
    </footer>
  )
}