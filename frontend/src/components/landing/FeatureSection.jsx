import {
  AlertTriangle,
  Gauge,
  Globe,
  GraduationCap,
  Link2,
  ShieldCheck,
} from 'lucide-react'
import { Container } from '../common/Container.jsx'
import { SectionHeader } from '../common/SectionHeader.jsx'
import { ResponsiveGrid } from '../common/ResponsiveGrid.jsx'
import { FeatureCard } from '../ui/index.js'

const FEATURES = [
  {
    icon: ShieldCheck,
    title: 'AI Scam Detection',
    description:
      'Analyze suspicious messages using AI-assisted contextual analysis.',
  },
  {
    icon: Link2,
    title: 'Phishing Message Detection',
    description:
      'Identify suspicious links, urgent language, impersonation, and common phishing patterns.',
  },
  {
    icon: AlertTriangle,
    title: 'UPI Fraud Indicators',
    description:
      'Highlight suspicious payment requests and potentially deceptive payment instructions.',
  },
  {
    icon: Globe,
    title: 'URL Risk Analysis',
    description:
      'Examine URL patterns and highlight potentially dangerous indicators without automatically opening suspicious links.',
  },
  {
    icon: Gauge,
    title: 'Risk Score & Explanation',
    description:
      'Present a risk score, severity level, and understandable reasons behind the assessment.',
  },
  {
    icon: GraduationCap,
    title: 'Security Awareness',
    description:
      'Help users learn about common digital payment scams and safer practices.',
  },
]

export function FeatureSection() {
  return (
    <section
      id="features"
      aria-labelledby="features-title"
      className="scroll-mt-24 py-16 sm:py-20 lg:py-24"
    >
      <Container size="xl">
        <SectionHeader
          id="features-title"
          eyebrow="Capabilities"
          title="Smart Protection Against Digital Payment Scams"
          description="Six layers of awareness designed to help you pause, check, and decide before acting on an unexpected request."
          align="center"
        />

        <div className="mt-10 sm:mt-12">
          <ResponsiveGrid columns={3} gap="lg">
            {FEATURES.map((feature) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </ResponsiveGrid>
        </div>

        <p className="type-caption mt-8 text-center">
          These capabilities describe the planned analysis workspace. The
          detection engine is not implemented yet.
        </p>
      </Container>
    </section>
  )
}
