import {
  CircleHelp,
  GraduationCap,
  Landmark,
  LibraryBig,
  SearchCheck,
  ShieldCheck,
  Siren,
  Sparkles,
} from 'lucide-react'

import { SCAMS, SCAM_CATEGORIES } from '../../data/awareness/scams.js'
import { SAFETY_RULES } from '../../data/awareness/safetyRules.js'
import { QUIZ_QUESTIONS } from '../../data/awareness/quiz.js'
import { BaseCard } from '../ui/index.js'
import { SafetyTip } from './SafetyTip.jsx'

const STATS = [
  { label: 'Scam guides', value: SCAMS.length, hint: 'Common UPI fraud techniques' },
  { label: 'Safety rules', value: SAFETY_RULES.length, hint: 'Practical habits to follow' },
  { label: 'Quiz questions', value: QUIZ_QUESTIONS.length, hint: 'Check your awareness' },
  { label: 'Categories', value: SCAM_CATEGORIES.length, hint: 'Ways fraud reaches you' },
]

const SECTION_LINKS = [
  { label: 'Scam library', href: '#scam-library', icon: LibraryBig },
  { label: 'Spot a scam', href: '#spot-a-scam', icon: SearchCheck },
  { label: 'Safety rules', href: '#safety-rules', icon: ShieldCheck },
  { label: 'If you are scammed', href: '#emergency', icon: Siren },
  { label: 'Quiz', href: '#quiz', icon: GraduationCap },
  { label: 'FAQ', href: '#faq', icon: CircleHelp },
  { label: 'Official resources', href: '#official-resources', icon: Landmark },
]

/** Top of the Awareness Center: orientation, counts, shortcuts, daily tip. */
export function AwarenessDashboard() {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
      <BaseCard padding="lg" className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-brand-500/10 blur-2xl"
          aria-hidden="true"
        />
        <p className="type-label text-brand-300">Awareness dashboard</p>
        <h2 className="type-h1 mt-2 max-w-lg">
          Learn. Spot. Respond.
        </h2>
        <p className="type-body mt-2 max-w-xl text-slate-300">
          Most UPI fraud succeeds by creating urgency or confusion. These plain-language
          guides explain how the common scams work, what they look like, and what to do
          before you act. No real messages, account numbers, or personal details are
          used here.
        </p>

        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="rounded-xl border border-white/8 bg-navy-900/50 p-3">
              <dd className="font-mono text-2xl font-semibold tracking-tight text-ink">
                {stat.value}
              </dd>
              <dt className="mt-0.5 text-xs font-medium text-slate-300">{stat.label}</dt>
              <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{stat.hint}</p>
            </div>
          ))}
        </dl>

        <nav className="mt-5" aria-label="Awareness sections">
          <p className="flex items-center gap-1.5 text-xs text-slate-500">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Jump to a section
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {SECTION_LINKS.map((link) => {
              const Icon = link.icon
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-brand-500/40 hover:text-ink"
                >
                  <Icon className="size-3.5 text-brand-300" aria-hidden="true" />
                  {link.label}
                </a>
              )
            })}
          </div>
        </nav>
      </BaseCard>

      <SafetyTip />
    </div>
  )
}
