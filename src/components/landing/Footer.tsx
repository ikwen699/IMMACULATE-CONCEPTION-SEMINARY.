import { MapPin, Phone, Mail, ExternalLink } from 'lucide-react'

const quickLinks = [
  { label: 'Sign In', href: '/login' },
  { label: 'Register', href: '/register' },
  { label: 'About Us', href: '#about' },
  { label: 'Academics', href: '#academics' },
  { label: 'Portal Features', href: '#features' },
]

export default function Footer() {
  return (
    <footer id="contact" className="bg-blue-950 text-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16 md:py-20">
        <div className="grid md:grid-cols-3 gap-12 md:gap-8 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <img
                src="/school-badge.jpg"
                alt="ICS Badge"
                className="w-10 h-10 rounded-full object-cover ring-2 ring-white/20"
              />
              <div>
                <p className="font-bold text-white text-sm tracking-wide">
                  Immaculate Conception
                </p>
                <p className="text-[11px] text-blue-300/70 tracking-[0.15em] uppercase">
                  Seminary
                </p>
              </div>
            </div>
            <p className="text-sm text-blue-200/60 leading-relaxed mb-4 italic">
              Scientia caritas iustitia
            </p>
            <p className="text-sm text-blue-200/60 leading-relaxed">
              Shaping minds, nurturing faith, and building character for over five decades in
              Cross River State, Nigeria.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-5 text-sm">Quick Links</h4>
            <ul className="space-y-2.5">
              {quickLinks.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="text-sm text-blue-200/60 hover:text-white transition-colors inline-flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-5 text-sm">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-blue-300/70 mt-0.5 shrink-0" />
                <span className="text-sm text-blue-200/60 leading-relaxed">
                  Mafamosing, Akampka Local Government Area,
                  <br />
                  Cross River State, Nigeria
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-blue-300/70 shrink-0" />
                <a
                  href="tel:+2347067867444"
                  className="text-sm text-blue-200/60 hover:text-white transition-colors"
                >
                  070 6786 7444
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-blue-300/70 shrink-0" />
                <a
                  href="mailto:immaculateconception@gmail.com"
                  className="text-sm text-blue-200/60 hover:text-white transition-colors"
                >
                  immaculateconception@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/[0.08] text-center">
          <p className="text-xs text-blue-200/40">
            &copy; {new Date().getFullYear()} Immaculate Conception Seminary. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
