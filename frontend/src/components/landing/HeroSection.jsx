import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Container } from '../common/Container.jsx'
import { Button } from '../ui/index.js'
import { HeroPreview } from './HeroPreview.jsx'

export function HeroSection() {
  return (
    <section
      id="home"
      aria-labelledby="hero-title"
      className="relative scroll-mt-24 overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 right-0 size-80 rounded-full bg-brand-500/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 left-0 size-72 rounded-full bg-success-500/5 blur-3xl"
      />

      <Container
        size="xl"
        className="relative grid gap-12 py-14 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12 lg:py-28"
      >
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/25 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-300">
            <Sparkles className="size-3.5" aria-hidden="true" />
            AI-assisted scam awareness
          </span>

          <h1 id="hero-title" className="type-display mt-6 xl:text-6xl">
            Don&rsquo;t Let{' '}
            <span className="bg-linear-to-r from-brand-300 via-brand-400 to-success-400 bg-clip-text text-transparent">
              UPI Scams
            </span>{' '}
            Catch You Off Guard.
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Analyze suspicious UPI messages, payment requests, and URLs with
            AI-powered security intelligence. Understand potential risks before you
            take action.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button
              as={Link}
              to="/detect"
              size="lg"
              className="w-full sm:w-auto"
              rightIcon={<ArrowRight className="size-4" aria-hidden="true" />}
            >
              Analyze a Message
            </Button>
            <Button
              as="a"
              href="#features"
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto"
            >
              Explore Features
            </Button>
          </div>

          <p className="mt-8 flex max-w-md items-start gap-2 text-sm text-muted">
            <ShieldCheck
              className="mt-0.5 size-4 shrink-0 text-brand-300"
              aria-hidden="true"
            />
            Built to make digital payments safer through smarter scam awareness.
          </p>
        </div>

        <div className="animate-fade-up [animation-delay:120ms]">
          <HeroPreview />
        </div>
      </Container>
    </section>
  )
}
