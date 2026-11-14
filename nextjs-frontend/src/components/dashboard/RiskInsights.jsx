"use client";

import { BaseCard } from '../ui/Card.jsx'

export function RiskInsights({ insights }) {
  const items = Array.isArray(insights) ? insights.filter(Boolean) : []

  return (
    <BaseCard className="mt-6">
      <div className="mb-3">
        <p className="type-label">Insights</p>
        <h3 className="type-h3 mt-1">Security Insights</h3>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400">No insights available yet. Run analyses to generate security insights.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((text, idx) => (
            <li key={idx} className="rounded-lg border border-white/10 p-3 text-sm text-slate-300">
              {String(text)}
            </li>
          ))}
        </ul>
      )}
    </BaseCard>
  )
}
