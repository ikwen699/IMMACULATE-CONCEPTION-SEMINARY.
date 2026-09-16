import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import About from '@/components/landing/About'
import Academics from '@/components/landing/Academics'
import Features from '@/components/landing/Features'
import CampusLife from '@/components/landing/CampusLife'
import Testimonials from '@/components/landing/Testimonials'
import Faq from '@/components/landing/Faq'
import CtaBand from '@/components/landing/CtaBand'
import Footer from '@/components/landing/Footer'
import BackToTop from '@/components/landing/BackToTop'
import { site } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Immaculate Conception Seminary — ICS School Portal',
  description:
    'Official portal of Immaculate Conception Seminary, Mafamosing. Access academic records, grades, assignments, fees, and school announcements from one secure sign-in.',
  openGraph: {
    title: 'Immaculate Conception Seminary — ICS School Portal',
    description:
      'Academic excellence and moral formation in Cross River State since 1972.',
    siteName: 'Immaculate Conception Seminary',
    type: 'website',
  },
}

export default async function Home() {
  const session = await auth()

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:rounded-xl focus:bg-gold-500 focus:text-blue-950 focus:font-semibold"
      >
        Skip to content
      </a>
      <Navbar isAuthenticated={!!session?.user} />
      <main id="main-content">
        <Hero isAuthenticated={!!session?.user} />
        <About />
        <Academics />
        <Features />
        <CampusLife />
        <Testimonials />
        <Faq />
        <CtaBand />
      </main>
      <Footer />
      <BackToTop />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'School',
            name: site.name,
            motto: site.motto,
            foundingDate: site.established,
            address: site.address,
            telephone: site.phone,
            email: site.email,
            sameAs: site.socials.map((s) => s.url),
          }),
        }}
      />
    </>
  )
}