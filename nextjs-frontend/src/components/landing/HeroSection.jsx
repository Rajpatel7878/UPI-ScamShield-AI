"use client";

import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from '@/lib/router-compat';
import { Container } from '../common/Container.jsx';
import { Button } from '../ui/index.js';
import GlobeBackground from '../../components/GlobeBackground.jsx';

export function HeroSection() {
  return (
    <section
      id="home"
      aria-labelledby="hero-title"
      className="relative scroll-mt-24 overflow-hidden"
    >
      {/* Cinematic globe background */}
      <GlobeBackground className="size-full" />

      {/* Content layer — sits above the globe */}
      <div className="relative z-10">
        <Container
          size="xl"
          className="relative grid gap-8 py-12 sm:py-20 lg:grid-cols-[1fr_0.85fr] lg:items-center lg:gap-10 lg:py-32"
        >
          <div className="animate-fade-up entrance-1">
            <span className="inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-300">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              AI-POWERED UPI FRAUD PROTECTION
            </span>

            <h1 id="hero-title" className="type-h1 mt-6 font-display">
              Your Money Deserves{' '}
              <span className="gradient-text block">Smarter Protection.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
              Identify suspicious UPI messages, analyze potentially dangerous
              links, and understand fraud warning signs before making your next
              move.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
              <Button
                as={Link}
                to="/detect"
                size="lg"
                className="w-full sm:w-auto"
                rightIcon={<ArrowRight className="size-4" aria-hidden="true" />}
              >
                Scan a Message
              </Button>
              <Button
                as={Link}
                to="/detect"
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto"
              >
                Check a Suspicious Link
              </Button>
            </div>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              {[['AI-Assisted Detection', 'ShieldCheck'], ['Intelligent Risk Analysis', 'Sparkles'], ['Privacy-Focused Protection', 'User']].map(
                ([label, iconName]) => {
                  const Icon =
                    iconName === 'ShieldCheck'
                      ? ShieldCheck
                      : iconName === 'Sparkles'
                        ? Sparkles
                        : ShieldCheck;
                  return (
                    <div
                      key={label}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/8 bg-white/5 text-sm"
                    >
                      <Icon className="size-4 text-brand-300" aria-hidden="true" />
                      <span className="text-slate-300">{label}</span>
                    </div>
                  );
                },
              )}
            </div>
          </div>

          <div className="animate-fade-up entrance-2 hidden sm:block">
            <div className="relative">
              <div
                className="absolute -inset-1 bg-gradient-to-r from-red-500 via-blue-500 to-magenta-500 rounded-2xl blur opacity-25"
                aria-hidden="true"
              />
              <div
                className="relative rounded-2xl border border-white/10 bg-navy-800/80 p-4 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="type-label text-brand-300">Live Threat Radar</span>
                  <span className="type-caption text-slate-500">Real-time risk signals</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[['Scans today', '1,842'], ['Blocked', '417'], ['Critical', '23']].map(
                    ([label, value]) => (
                      <div key={label} className="text-center">
                        <p className="type-caption text-slate-500">{label}</p>
                        <p className="type-stat">{value}</p>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        </Container>
      </div>
    </section>
  );
}
