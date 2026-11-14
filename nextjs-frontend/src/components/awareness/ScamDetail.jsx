"use client";

import { createElement } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  CheckCircle2,
  EyeOff,
  Megaphone,
  ShieldAlert,
  Siren,
  TriangleAlert,
} from 'lucide-react'
import { Alert, BaseCard, Button } from '../ui/index.js'
import { getScamById } from '../../data/awareness/scams.js'
import { getScamIcon } from './scamIcons.js'

function DetailSection({ icon: Icon, title, tone = 'brand', children }) {
  const toneClass = {
    brand: 'text-brand-300',
    warning: 'text-warning-400',
    danger: 'text-danger-400',
    success: 'text-success-400',
  }[tone]

  return (
    <section className="rounded-xl border border-white/8 bg-navy-900/50 p-4 sm:p-5">
      <h4 className={`flex items-center gap-2 text-sm font-semibold ${toneClass}`}>
        <Icon className="size-4 shrink-0" aria-hidden="true" />
        {title}
      </h4>
      <div className="mt-3">{children}</div>
    </section>
  )
}

function BulletList({ items }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5 type-body-sm text-slate-300">
          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-500/70" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

/** Full educational guide for one scam type. */
export function ScamDetail({ scam, onBack, onOpen }) {
  const icon = getScamIcon(scam.icon)
  const related = scam.related.map(getScamById).filter(Boolean)

  return (
    <div className="animate-fade-in">
      <Button
        variant="ghost"
        size="sm"
        leftIcon={<ArrowLeft className="size-4" aria-hidden="true" />}
        onClick={onBack}
        className="-ml-2 mb-4"
      >
        Back to scam library
      </Button>

      <BaseCard padding="lg">
        <div className="flex flex-wrap items-start gap-4">
          <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-300 ring-1 ring-brand-500/20">
            {createElement(icon, { className: 'size-6', 'aria-hidden': true })}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="type-label text-brand-300">{scam.category}</span>
              <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-muted">
                Educational guide
              </span>
            </div>
            <h3 className="type-h2 mt-2">{scam.name}</h3>
            <p className="type-body mt-2 max-w-3xl text-slate-300">{scam.description}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <DetailSection icon={ShieldAlert} title="Scam overview">
            <p className="type-body-sm text-slate-300">{scam.attackerApproach}</p>
          </DetailSection>

          <DetailSection icon={Megaphone} title="How the scam works" tone="warning">
            <ol className="space-y-2">
              {scam.howItWorks.map((step, index) => (
                <li key={step} className="flex gap-2.5 type-body-sm text-slate-300">
                  <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-warning-500/10 font-mono text-[11px] text-warning-400">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </DetailSection>

          <DetailSection icon={Brain} title="Psychological manipulation techniques" tone="danger">
            <BulletList items={scam.manipulationTechniques} />
          </DetailSection>

          <DetailSection icon={TriangleAlert} title="Common warning signs" tone="warning">
            <BulletList items={scam.warningSigns} />
          </DetailSection>
        </div>

        <div className="mt-4">
          <Alert tone="warning" title="Fictional example — for education only">
            <p className="whitespace-pre-line italic text-slate-300">
              “{scam.exampleMessage}”
            </p>
            <p className="mt-2 text-xs text-slate-400">
              This message is invented to show how the scam may look. It is not a
              real message and does not describe a real person or account.
            </p>
          </Alert>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <DetailSection icon={CheckCircle2} title="How to avoid it" tone="success">
            <BulletList items={scam.howToAvoid} />
          </DetailSection>

          <DetailSection icon={Siren} title="If you are targeted" tone="danger">
            <BulletList items={scam.whatToDo} />
            <p className="type-body-sm mt-3 text-slate-400">
              If money was lost, report to India&rsquo;s cybercrime helpline{' '}
              <a href="tel:1930" className="font-medium text-danger-400 underline underline-offset-4">
                1930
              </a>{' '}
              as soon as possible.
            </p>
          </DetailSection>
        </div>

        {related.length > 0 && (
          <div className="mt-6 border-t border-white/5 pt-5">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-brand-300">
              <EyeOff className="size-4" aria-hidden="true" />
              Related scam categories
            </h4>
            <div className="mt-3 flex flex-wrap gap-2">
              {related.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onOpen?.(item.id)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-brand-500/40 hover:text-ink"
                >
                  {item.name}
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
        )}
      </BaseCard>
    </div>
  )
}
