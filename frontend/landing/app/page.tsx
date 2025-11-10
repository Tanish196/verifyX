import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import HowItWorks from '@/components/HowItWorks'
import InputSection from '@/components/InputSection'
import ExtensionDemo from '@/components/ExtensionDemo'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <HowItWorks />
      <InputSection />
      <ExtensionDemo />
      <Footer />
    </div>
  )
}
