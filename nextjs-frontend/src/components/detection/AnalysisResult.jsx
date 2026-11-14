"use client";

import { AlertCircle, ShieldCheck, Sparkles } from 'lucide-react'
import { cn } from '../../utils/cn.js'

const SEVERITY_STYLES = {
  low: 'bg-success-500/10 text-success-400 ring-success-500/25',
  medium: 'bg-warning-500/10 text-warning-400 ring-warning-500/25',
  high: 'bg-danger-500/10 text-danger-400 ring-danger-500/25',
  critical: 'bg-red-500 text-white ring-red-500/40',
}

const SEVERITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

function riskColor(severity) {
  const s = String(severity || 'low').toLowerCase()
  if (s === 'critical') return '#ff365d'
  if (s === 'high') return '#ef4444'
  if (s === 'medium') return '#f59e0b'
  return '#22c55e'
}

function RiskScore({ score, severity }) {
  const percent = Math.min(Math.max(Number(score) || 0, 0), 100)
  const circumference = 2 * Math.PI * 24
  const offset = circumference - (percent / 100) * circumference
  const color = riskColor(severity)

  return (
    <div className="relative">
      <svg
        className="risk-circle"
        width="100"
        height="100"
        viewBox="0 0 56 56"
      >
        <circle
          className="risk-circle-bg"
          cx="28"
          cy="28"
          r="24"
        />
        <circle
          className="risk-circle-progress"
          cx="28"
          cy="28"
          r="24"
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </svg>
      <div className="risk-circle-content">
        <span className="text-xs font-mono font-semibold text-ink">{percent}</span>
        <span className="text-[10px] text-slate-500">/ 100</span>
      </div>
    </div>
  )
}

function SeverityBadge({ severity }) {
  const value = String(severity || 'low').toLowerCase()
  const style = SEVERITY_STYLES[value] ?? SEVERITY_STYLES.low
  const label = SEVERITY_LABELS[value] ?? 'Low'

  return (
    <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset', style)}>
      <span className={cn('size-1.5 rounded-full', style === SEVERITY_STYLES.critical ? 'bg-white' : 'bg-current')} aria-hidden="true" />
      {label} risk
    </span>
  )
}

function indicatorText(indicator) {
  if (typeof indicator === 'string') return { name: indicator }
  return indicator || {}
}

const AI_PROVIDER_LABELS = {
  gemini: 'Gemini',
  openrouter: 'OpenRouter',
}

function providerLabel(provider) {
  return AI_PROVIDER_LABELS[String(provider || '').toLowerCase()] || 'AI'
}

function indicatorSourceLabel(source, provider) {
  if (source === 'url_based') return 'URL analysis'
  if (source === 'gemini' || source === 'openrouter') return providerLabel(provider)
  return 'Rules'
}

export function AnalysisResult({ result, hasResult, onDismiss }) {
  if (!hasResult || !result) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
        <div className="inline-flex size-12 items-center justify-center rounded-full bg-white/5 mb-4 text-slate-500">
          <ShieldCheck className="size-5" aria-hidden="true" />
        </div>
        <p className="type-body text-slate-500">
          Your analysis results will appear here.
        </p>
      </div>
    )
  }

  const {
    riskScore,
    severity,
    category,
    summary,
    indicators = [],
    recommendedActions = [],
    safetyWarning,
    analysisType,
    aiStatus,
    aiProvider,
    aiModel,
  } = result

  return (
    <section
      aria-labelledby="analysis-result-heading"
      className="rounded-xl border border-white/10 bg-white/5 p-6 glass-strong shadow-lift"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="type-label text-slate-400">Analysis complete</p>
          <h2 id="analysis-result-heading" className="type-h2 mt-1 font-display">
            {category}
          </h2>
        </div>
        <div className="flex flex-col items-end gap-2">
          <SeverityBadge severity={severity} />
          <span className="type-caption text-slate-500">
            {analysisType?.replaceAll('_', ' ')}
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-3">
        <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
          <p className="type-field-label text-slate-400 mb-2">Risk score</p>
          <RiskScore score={riskScore} severity={severity} />
        </div>
        <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4 flex flex-col justify-between">
          <div>
            <p className="type-field-label text-slate-400">AI assistance</p>
            <p className="type-caption mt-2 flex items-center gap-1.5 text-slate-400">
              <Sparkles className="size-3.5 text-red-300" aria-hidden="true" />
              {aiStatus === 'completed'
                ? `${providerLabel(aiProvider)} analysis included${aiModel ? ` (${aiModel})` : ''}`
                : 'Not used — rule and URL analysis only'}
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
          <p className="type-field-label text-slate-400">Analysis type</p>
          <p className="type-body mt-1 text-slate-300 capitalize">
            {analysisType?.replaceAll('_', ' ')}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <p className="type-field-label text-slate-400">Summary</p>
        <p className="type-body mt-1 text-slate-300 leading-relaxed">{summary}</p>
      </div>

      {indicators.length > 0 && (
        <div className="mt-6">
          <p className="type-field-label text-slate-400 mb-3">Detected indicators</p>
          <ul className="space-y-3">
            {indicators.map((indicator, index) => {
              const item = indicatorText(indicator)
              return (
                <li
                  key={`${item.name}-${index}`}
                  className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-4"
                >
                  <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-red-300" aria-hidden="true" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-ink">
                        {item.name || 'Indicator'}
                      </span>
                      {item.severity && <SeverityBadge severity={item.severity} />}
                      {item.source && (
                        <span className="type-caption text-slate-500">
                          Source: {indicatorSourceLabel(item.source, aiProvider)}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="type-body-sm text-slate-400 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                    {item.url && (
                      <p className="type-mono mt-2 break-all text-slate-500">
                        {item.url}
                      </p>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
          <p className="type-caption mt-3 text-slate-500">
            Heuristic findings should be treated as indicators, not verified proof of fraud.
          </p>
        </div>
      )}

      {recommendedActions.length > 0 && (
        <div className="mt-6">
          <p className="type-field-label text-slate-400 mb-3">Recommended actions</p>
          <ul className="space-y-2">
            {recommendedActions.map((action, index) => (
              <li key={`${action}-${index}`} className="flex items-start gap-3 p-3 rounded-lg border border-white/5 bg-white/[0.02]">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-warning-500" aria-hidden="true" />
                <p className="type-body-sm text-slate-300 leading-relaxed">{action}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {safetyWarning && (
        <div className="mt-6 rounded-xl border border-red-500/25 bg-red-500/5 p-4">
          <p className="type-field-label text-red-400 mb-1">Safety warning</p>
          <p className="type-body-sm text-slate-300">{safetyWarning}</p>
        </div>
      )}

      <p className="type-caption mt-6 text-slate-500">
        Heuristic risk assessment — not proof that a message is fraudulent. URLs
        are never opened or fetched.
      </p>

      <button
        type="button"
        onClick={onDismiss}
        className="mt-6 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-300 transition-all duration-300 hover:bg-white/10 hover:border-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
      >
        Clear result
      </button>
    </section>
  )
}
