import { useState } from 'react'
import { CheckCircle2, RotateCcw, ShieldCheck } from 'lucide-react'

import { SAFETY_RULES } from '../../data/awareness/safetyRules.js'
import { Button } from '../ui/index.js'

/** Interactive UPI safety checklist. Checked state is local to the session only. */
export function SafetyChecklist() {
  const [checked, setChecked] = useState(() => new Set())

  const toggle = (id) => {
    setChecked((previous) => {
      const next = new Set(previous)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const reviewed = checked.size
  const total = SAFETY_RULES.length
  const complete = reviewed === total

  return (
    <div>
      <div className="rounded-card border border-white/8 bg-navy-800 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-ink">
              <ShieldCheck className="size-4 text-brand-300" aria-hidden="true" />
              {reviewed} of {total} rules reviewed
            </p>
            <p className="type-body-sm mt-1">
              Tick each rule after reading it. Nothing is saved or sent anywhere.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<RotateCcw className="size-3.5" aria-hidden="true" />}
            onClick={() => setChecked(new Set())}
            disabled={reviewed === 0}
          >
            Reset checklist
          </Button>
        </div>
        <div
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={reviewed}
          aria-label="Safety rules reviewed"
        >
          <div
            className="h-full rounded-full bg-brand-500 transition-[width] duration-300"
            style={{ width: `${(reviewed / total) * 100}%` }}
          />
        </div>
        {complete && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-success-400" role="status">
            <CheckCircle2 className="size-3.5" aria-hidden="true" />
            You have reviewed all the safety rules. Revisit them whenever you receive
            an unexpected request.
          </p>
        )}
      </div>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {SAFETY_RULES.map((rule) => {
          const isChecked = checked.has(rule.id)
          const Icon = rule.icon
          return (
            <li key={rule.id}>
              <label
                htmlFor={`safety-rule-${rule.id}`}
                className={`flex h-full cursor-pointer gap-3 rounded-xl border p-4 transition-colors ${
                  isChecked
                    ? 'border-brand-500/40 bg-brand-500/[0.07]'
                    : 'border-white/8 bg-navy-800 hover:border-white/15'
                }`}
              >
                <input
                  id={`safety-rule-${rule.id}`}
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggle(rule.id)}
                  className="mt-0.5 size-4 shrink-0 cursor-pointer accent-brand-500"
                />
                <span className="min-w-0">
                  <span className="flex items-start gap-2">
                    <Icon className="mt-0.5 size-4 shrink-0 text-brand-300" aria-hidden="true" />
                    <span className={`text-sm font-medium ${isChecked ? 'text-brand-200' : 'text-ink'}`}>
                      {rule.title}
                    </span>
                  </span>
                  <span className="type-body-sm mt-1.5 block text-slate-400">{rule.summary}</span>
                  <span className="mt-2 block border-l border-white/10 pl-2.5 text-xs italic leading-relaxed text-slate-500">
                    {rule.example}
                  </span>
                </span>
              </label>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
