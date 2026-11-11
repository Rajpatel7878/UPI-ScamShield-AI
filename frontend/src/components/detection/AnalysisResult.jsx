import { AlertCircle, ShieldCheck, Sparkles } from 'lucide-react'
import { cn } from '../../utils/cn.js'

const SEVERITY_STYLES = {
  low: 'bg-brand-500/10 text-brand-300',
  medium: 'bg-emerald-500/10 text-emerald-400',
  high: 'bg-amber-500/10 text-amber-400',
  critical: 'bg-danger-500/10 text-danger-400',
}

const SEVERITY_BARS = {
  low: 'bg-brand-400',
  medium: 'bg-emerald-400',
  high: 'bg-amber-400',
  critical: 'bg-danger-500',
}

function RiskScore({ score, severity }) {
  const percent = Math.min(Math.max(Number(score) || 0, 0), 100)
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="type-field-label">Risk score</span>
        <span className="font-mono text-sm font-semibold text-ink">{percent}/100</span>
      </div>
      <div
        className="mt-2 h-2 w-full overflow-hidden rounded-full bg-navy-700"
        role="img"
        aria-label={`Risk score ${percent} out of 100`}
      >
        <div
          className={cn('h-full rounded-full transition-all duration-500', SEVERITY_BARS[severity] || SEVERITY_BARS.low)}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

function SeverityBadge({ severity }) {
  const value = String(severity || 'low').toLowerCase()
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-1 text-xs font-medium capitalize', SEVERITY_STYLES[value] || SEVERITY_STYLES.low)}>
      {value}
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
      <div className="rounded-card border border-dashed border-white/10 bg-navy-900/30 p-6 text-center">
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
      className="rounded-card border border-white/10 bg-navy-800 p-5 shadow-card sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="type-label">Analysis complete</p>
          <h2 id="analysis-result-heading" className="type-h2 mt-1">
            {category}
          </h2>
        </div>
        <div className="flex flex-col items-end gap-1">
          <SeverityBadge severity={severity} />
          <span className="type-caption">{analysisType?.replaceAll('_', ' ')}</span>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <RiskScore score={riskScore} severity={severity} />
        <div>
          <p className="type-field-label">AI assistance</p>
          <p className="type-caption mt-2 flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-brand-300" aria-hidden="true" />
            {aiStatus === 'completed'
              ? `${providerLabel(aiProvider)} analysis included${aiModel ? ` (${aiModel})` : ''}`
              : 'Not used — rule and URL analysis only'}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <p className="type-field-label">Summary</p>
        <p className="type-body mt-1">{summary}</p>
      </div>

      {indicators.length > 0 && (
        <div className="mt-5">
          <p className="type-field-label">Detected indicators</p>
          <ul className="mt-2 space-y-2">
            {indicators.map((indicator, index) => {
              const item = indicatorText(indicator)
              return (
                <li key={`${item.name}-${index}`} className="rounded-lg border border-white/5 bg-navy-900/40 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <ShieldCheck className="size-3.5 text-brand-400" aria-hidden="true" />
                    <span className="text-sm font-medium text-ink">{item.name || 'Indicator'}</span>
                    {item.severity && <SeverityBadge severity={item.severity} />}
                    {item.source && (
                      <span className="type-caption">
                        {indicatorSourceLabel(item.source, aiProvider)}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="type-body-sm mt-1 text-slate-300">{item.description}</p>
                  )}
                  {item.url && (
                    <p className="type-mono mt-1 break-all text-slate-500">{item.url}</p>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {recommendedActions.length > 0 && (
        <div className="mt-5">
          <p className="type-field-label">Recommended actions</p>
          <ul className="mt-2 space-y-1.5">
            {recommendedActions.map((action, index) => (
              <li key={`${action}-${index}`} className="flex items-start gap-2 text-sm text-slate-300">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-warning-400" aria-hidden="true" />
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {safetyWarning && (
        <div className="mt-5 rounded-lg border border-danger-500/20 bg-danger-500/5 p-3">
          <p className="type-field-label text-danger-400">Safety warning</p>
          <p className="type-body-sm mt-1 text-slate-300">{safetyWarning}</p>
        </div>
      )}

      <p className="type-caption mt-4">
        Heuristic risk assessment — not proof that a message is fraudulent. URLs
        are never opened or fetched.
      </p>

      <button
        type="button"
        onClick={onDismiss}
        className="mt-4 w-full rounded-lg border border-navy-700 bg-navy-900/50 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5"
      >
        Clear result
      </button>
    </section>
  )
}
