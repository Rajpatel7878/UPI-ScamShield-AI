import { Info } from 'lucide-react'

import {
  AwarenessDashboard,
  EmergencyResponse,
  FaqSection,
  KnowledgeQuiz,
  OfficialResources,
  SafetyChecklist,
  ScamLibrary,
  SuspiciousMessages,
} from '../components/awareness/index.js'
import { SectionHeader } from '../components/common/SectionHeader.jsx'

function Section({ id, titleId, children }) {
  return (
    <section id={id} aria-labelledby={titleId} className="scroll-mt-24">
      {children}
    </section>
  )
}

/** Scam Awareness and Education Center (Phase 16). */
function Awareness() {
  return (
    <div className="space-y-10">
      <AwarenessDashboard />

      <Section id="scam-library" titleId="scam-library-title">
        <SectionHeader
          id="scam-library-title"
          eyebrow="Scam library"
          title="Common UPI scams"
          description="Fifteen guides covering the fraud patterns reported most often around UPI payments. Open any guide for how the scam works, warning signs, a fictional example, and what to do."
        />
        <div className="mt-4">
          <ScamLibrary />
        </div>
        <p className="type-body-sm mt-3 flex items-start gap-2 text-slate-500">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          All example messages in these guides are fictional and written for
          education. They do not contain real victims&rsquo; information.
        </p>
      </Section>

      <Section id="spot-a-scam" titleId="spot-a-scam-title">
        <SectionHeader
          id="spot-a-scam-title"
          eyebrow="Know the signals"
          title="How to identify suspicious messages"
          description="Fraud messages usually combine a trusted identity with pressure to act. One red flag is enough reason to pause and verify independently."
        />
        <div className="mt-4">
          <SuspiciousMessages />
        </div>
      </Section>

      <Section id="safety-rules" titleId="safety-rules-title">
        <SectionHeader
          id="safety-rules-title"
          eyebrow="Everyday habits"
          title="UPI safety rules"
          description="Twelve practical rules that prevent most payment fraud. Read them once, then use the checklist whenever you want a refresher."
        />
        <div className="mt-4">
          <SafetyChecklist />
        </div>
      </Section>

      <Section id="emergency" titleId="emergency-title">
        <SectionHeader
          id="emergency-title"
          eyebrow="Emergency"
          title="If you have been scammed"
          description="Act quickly and keep every reference. Reporting gives authorities the best chance to act, but recovery is never guaranteed."
        />
        <div className="mt-4">
          <EmergencyResponse />
        </div>
      </Section>

      <Section id="quiz" titleId="quiz-title">
        <SectionHeader
          id="quiz-title"
          eyebrow="Check your awareness"
          title="UPI scam awareness quiz"
          description="Twelve multiple-choice questions on PIN safety, OTPs, collect requests, QR codes, phishing, and reporting. You get feedback after each answer and a full review at the end."
        />
        <div className="mt-4">
          <KnowledgeQuiz />
        </div>
      </Section>

      <Section id="faq" titleId="faq-title">
        <SectionHeader
          id="faq-title"
          eyebrow="Common questions"
          title="Frequently asked questions"
          description="Direct answers to the questions people ask most often after a suspicious payment request."
        />
        <div className="mt-4">
          <FaqSection />
        </div>
      </Section>

      <Section id="official-resources" titleId="official-resources-title">
        <SectionHeader
          id="official-resources-title"
          eyebrow="Official channels"
          title="Cybercrime reporting resources"
          description="Use these official Government of India and payments-industry resources to report fraud or verify information. They are external to this application."
        />
        <div className="mt-4">
          <OfficialResources />
        </div>
      </Section>

      <p className="type-body-sm border-t border-white/5 pt-5 text-slate-500">
        UPI ScamShield AI is an independent educational project. The guidance here is
        general awareness material, not legal, financial, or banking advice. For a
        specific dispute or account issue, contact your bank through its official
        channels.
      </p>
    </div>
  )
}

export default Awareness
