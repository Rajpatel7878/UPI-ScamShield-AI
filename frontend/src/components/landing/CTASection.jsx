import { ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Container } from '../common/Container.jsx';
import { Button } from '../ui/index.js';

export function CTASection() {
  return (
    <section
      aria-labelledby="cta-title"
      className="py-16 sm:py-20 lg:py-28 relative overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-red-500/10 via-blue-500/5 to-magenta-500/10"
      />
      <Container size="lg">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-glass p-8 md:p-16 glass-strong shadow-lift">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-red-500/10 blur-[100px]"
          />
          <ShieldCheck
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-12 -right-8 size-64 text-white/[0.04]"
            strokeWidth={1}
          />

          <div className="relative mx-auto max-w-2xl text-center">
            <p className="type-label text-red-300">Check before you act</p>
            <h2 id="cta-title" className="type-h1 mt-3 sm:text-5xl gradient-text">
              Think Something Looks Suspicious? Check It First.
            </h2>
            <p className="mx-auto mt-6 max-w-xl type-body text-slate-400">
              Take a moment to understand the warning signs before responding to
              an unexpected payment request.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                as={Link}
                to="/detect"
                size="lg"
                className="w-full sm:w-auto px-8 py-4"
                rightIcon={<ArrowRight className="size-4" aria-hidden="true" />}
              >
                Start Free Analysis
              </Button>
              <Button
                as="a"
                href="#how-it-works"
                variant="ghost"
                size="lg"
                className="w-full sm:w-auto neon-border-blue"
              >
                See how it works
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
