"use client";

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Container } from '../common/Container.jsx';
import { SectionHeader } from '../common/SectionHeader.jsx';
import { GlassCard } from '../ui/index.js';

const FAQS = [
  {
    q: 'What is UPI ScamShield AI?',
    a: (
      <>
        UPI ScamShield AI is a scam-awareness and detection platform for the UPI
        ecosystem. It helps you identify suspicious messages, analyze
        potentially dangerous links, and understand fraud warning signs before
        you respond to an unexpected payment request.
      </>
    ),
  },
  {
    q: 'How does the risk scoring work?',
    a: (
      <>
        The hybrid risk score combines <strong>60% rule-based detection</strong>
        (known scam patterns, suspicious keywords, URL risk signals) with
        <strong>40% AI-assisted analysis</strong> (OpenRouter with Gemini
        fallback). Results are mapped to Low, Medium, High, or Critical risk
        categories on a 0–100 scale.
      </>
    ),
  },
  {
    q: 'Is my message data stored or shared?',
    a: (
      <>
        Raw submitted messages are <strong>not stored</strong>. Only the risk
        score, category, indicators, and recommendations are saved to your
        history. When AI assistance is enabled, message text is sent to a
        configured AI provider after OTP, PIN, password, and card values are
        masked.
      </>
    ),
  },
  {
    q: 'Are suspicious links opened automatically?',
    a: (
      <>
        No. URL analysis is <strong>passive</strong> — link patterns are
        examined without automatically visiting or fetching the destination.
        Never enter your UPI PIN, OTP, or banking password into any link.
      </>
    ),
  },
  {
    q: 'What scam types does it detect?',
    a: (
      <>
        Common UPI scams covered include fake KYC requests, OTP phishing,
        cashback reward lures, fake customer support, QR code scams, collect
        request scams, phishing links, electricity bill scams, and impersonation
        scams.
      </>
    ),
  },
  {
    q: 'Can the AI be wrong?',
    a: (
      <>
        Yes. AI-assisted assessments can be wrong or incomplete. Always confirm
        unexpected requests through your bank&rsquo;s official app or website
        before sharing information or approving a payment. Results are guidance,
        not guarantees.
      </>
    ),
  },
];

export function FAQSection() {
  const [openId, setOpenId] = useState(null);

  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="scroll-mt-24 border-y border-white/5 bg-navy-900/20 py-16 sm:py-20 lg:py-28 relative overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-blue-500/5"
      />
      <Container size="xl">
        <SectionHeader
          id="faq-title"
          eyebrow="Frequently asked questions"
          title="Everything You Need to Know"
          description="Direct answers to the questions people ask most often about UPI fraud protection."
          align="center"
        />

        <div className="mt-12 max-w-2xl mx-auto space-y-3">
          {FAQS.map(({ q, a }, index) => {
            const isOpen = openId === index;
            return (
              <GlassCard
                key={q}
                className={`group cursor-pointer border-white/8 hover:border-red-500/30 transition-all duration-300 animate-fade-up entrance-${Math.min(index + 3, 5)}`}
                padding="md"
                onClick={() => setOpenId(isOpen ? null : index)}
              >
                <div className="flex items-center justify-between">
                  <h3 className="type-h3 group-hover:text-red-300 transition-colors">
                    {q}
                  </h3>
                  <ChevronDown
                    className={`size-4 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} text-slate-500 group-hover:text-red-400`}
                    aria-hidden="true"
                  />
                </div>
                {isOpen && (
                  <div className="mt-3 pt-3 border-t border-white/5 type-body text-slate-400 leading-relaxed">
                    {a}
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>

        <div className="mt-12 flex justify-center">
          <p className="type-caption text-slate-500">
            Still have questions? Visit the{' '}
            <a
              href="#awareness"
              className="text-red-300 hover:underline transition-colors"
            >
              Scam Awareness Center
            </a>
            .
          </p>
        </div>
      </Container>
    </section>
  );
}
