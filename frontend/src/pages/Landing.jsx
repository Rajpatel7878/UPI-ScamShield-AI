import {
  CTASection,
  DemoAnalysis,
  FAQSection,
  FeatureSection,
  Footer,
  HeroSection,
  HowItWorks,
  Navbar,
  SecuritySection,
  TrustStrip,
} from '../components/landing/index.js'

function Landing() {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-brand-500 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-navy-950"
      >
        Skip to content
      </a>

      <Navbar />

      <main id="main" className="flex-1">
        <HeroSection />
        <TrustStrip />
        <FeatureSection />
        <HowItWorks />
        <DemoAnalysis />
        <SecuritySection />
        <FAQSection />
        <CTASection />
      </main>

      <Footer />
    </div>
  )
}

export default Landing
