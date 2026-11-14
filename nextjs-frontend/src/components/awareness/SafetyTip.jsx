"use client";

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react'

import { SAFETY_TIPS } from '../../data/awareness/emergency.js'
import { IconButton } from '../ui/index.js'

/** One curated safety tip at a time with manual navigation. */
export function SafetyTip() {
  const [index, setIndex] = useState(0)
  const tip = SAFETY_TIPS[index]

  const previous = () =>
    setIndex((current) => (current - 1 + SAFETY_TIPS.length) % SAFETY_TIPS.length)
  const next = () => setIndex((current) => (current + 1) % SAFETY_TIPS.length)

  return (
    <div className="rounded-card border border-brand-500/25 bg-gradient-to-br from-brand-500/[0.12] via-navy-800 to-navy-800 p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-brand-300">
          <Lightbulb className="size-4" aria-hidden="true" />
          Safety tip
        </p>
        <p className="font-mono text-xs text-slate-500">
          {index + 1} / {SAFETY_TIPS.length}
        </p>
      </div>

      <p
        className="mt-3 min-h-12 text-sm leading-relaxed text-slate-200 sm:text-base"
        aria-live="polite"
      >
        {tip}
      </p>

      <div className="mt-4 flex items-center gap-2">
        <IconButton
          label="Previous safety tip"
          size="sm"
          variant="secondary"
          onClick={previous}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </IconButton>
        <IconButton
          label="Next safety tip"
          size="sm"
          variant="secondary"
          onClick={next}
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </IconButton>
        <div className="ml-1 flex gap-1" aria-hidden="true">
          {SAFETY_TIPS.map((item, dotIndex) => (
            <span
              key={item}
              className={`h-1 rounded-full transition-all ${
                dotIndex === index ? 'w-4 bg-brand-400' : 'w-1 bg-white/15'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
