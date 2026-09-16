import { auth } from '@/lib/auth'
import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import About from '@/components/landing/About'
import Academics from '@/components/landing/Academics'
import Features from '@/components/landing/Features'
import Testimonials from '@/components/landing/Testimonials'
import Footer from '@/components/landing/Footer'

export default async function Home() {
  const session = await auth()

  return (
    <>
      <Navbar isAuthenticated={!!session?.user} />
      <main>
        <Hero isAuthenticated={!!session?.user} />
        <About />
        <Academics />
        <Features />
        <Testimonials />
      </main>
      <Footer />
    </>
  )
}