import { ArrowRight, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Container } from '../common/Container.jsx'
import { Button } from '../ui/index.js'

export function CTASection() {
  return (
    <section aria-labelledby="cta-title" className="py-16 sm:py-20 lg:py-24">
      <Container size="lg">
        <div className="relative overflow-hidden rounded-card border border-brand-500/20 bg-linear-to-br from-navy-900 via-navy-800 to-navy-900 px-6 py-12 shadow-lift sm:px-12 sm:py-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-brand-500/10 blur-3xl"
          />
          <ShieldCheck
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-10 -right-6 size-48 text-white/[0.03]"
            strokeWidth={1}
          />

          <div className="relative mx-auto max-w-2xl text-center">
            <p className="type-label text-brand-300">Check before you act</p>
            <h2 id="cta-title" className="type-h1 mt-3 sm:text-4xl">
              Think Something Looks Suspicious? Check It First.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
              Take a moment to understand the warning signs before responding to
              an unexpected payment request.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                as={Link}
                to="/detect"
                size="lg"
                className="w-full sm:w-auto"
                rightIcon={<ArrowRight className="size-4" aria-hidden="true" />}
              >
                Start Free Analysis
              </Button>
              <Button
                as="a"
                href="#how-it-works"
                variant="ghost"
                size="lg"
                className="w-full sm:w-auto"
              >
                See how it works
              </Button>
            </div>
            <p className="type-caption mt-5">
              The analysis workspace is planned for a later phase. No message is
              analysed today.
            </p>
          </div>
        </div>
      </Container>
    </section>
  )
}
