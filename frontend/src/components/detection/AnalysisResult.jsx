import { ShieldCheck, Lock, Gift, UserRound, AlertCircle } from 'lucide-react'
import { cn } from '../../utils/cn.js'

/** Risk severity color mapping. */
const SEVERITY_COLORS = {
  low: 'brand',
  medium: 'emerald',
  high: 'amber',
  critical: 'danger',
}

/** Risk severity badge colors. */
const SEVERITY_BADGES = {
  low: 'bg-brand-500/10 text-brand-300',
  medium: 'bg-emerald-500/10 text-emerald-400',
  high: 'bg-amber-500/10 text-amber-400',
  critical: 'bg-danger-500/10 text-danger-400',
}

/**
 * Result shape supplied by the backend.
 * Used for type safety when the real analysis engine is integrated.
 */
/**
 * @typedef {{ riskScore: number, severity: 'low' | 'medium' | 'high' | 'critical', category: string, summary: string, indicators: string[], recommendedActions: string[], safetyWarning: string }} AnalysisResult
 */

/**
 * @typedef {{ result?: AnalysisResult, hasResult: boolean, onDismiss: () => void }} Props
 */

/** Format risk score with visual indicator. */
function RiskScore(score) {
  const percent = Math.min(Math.max(score, 0), 100)
  return (
    <div className="flex items-baseline gap-2">
      <span className="type-caption font-medium">Risk Score: {score}/100</span>
      <span>
        <div
          className="w-24 h-1.5 rounded-full bg-navy-700 overflow-hidden"
          style={{ width: `${percent}%` }}
        >
          <div
            className={cn(
              "h-full rounded-full",
              SEVERITY_COLORS['critical'] === 'critical'
                ? 'bg-danger-500'
                : SEVERITY_COLORS['critical'] === 'high'
                  ? 'bg-amber-500'
                  : SEVERITY_COLORS['critical'] === 'medium'
                    ? 'bg-emerald-500'
                    : 'bg-brand-500',
            )}
          />
        </div>
      </span>
    </div>
  )
}

/** Severity badge. */
function SeverityBadge(severity) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
        SEVERITY_BADGES[severity],
      )}
    >
      {severity}
    </span>
  )
}

export function AnalysisResult({ result, hasResult, onDismiss }) {
  if (!hasResult || !result) {
    return (
      <div className="pt-6 text-center">
        <p className="type-body text-slate-500">
          Your analysis results will appear here.
        </p>
      </div>
    )
  }

  const { riskScore, severity, category, summary, indicators, recommendedActions, safetyWarning } = result

  return (
    <div className="space-y-6">
      {/* Risk score header */}
      <div className="grid grid-cols-2 gap-4">
        <RiskScore score={riskScore} />
        <SeverityBadge severity={severity} />
      </div>

      <div>
        <p className="type-field-label">Category</p>
        <p className="type-body mt-1">{category}</p>
      </div>

      <div>
        <p className="type-field-label">Summary</p>
        <p className="type-body mt-1">{summary}</p>
      </div>

      {/* Detected indicators */}
      {indicators.length > 0 && (
        <div>
          <p className="type-field-label">Detected Indicators</p>
          <ul className="mt-2 space-y-1 text-slate-300 text-sm line-clamp-3">
            {indicators.map((indicator, i) => (
              <li key={i} className="flex items-start gap-2">
                <ShieldCheck className="size-3 mt-0.5 text-brand-400" aria-hidden />
                <span>{indicator}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommended actions */}
      {recommendedActions.length > 0 && (
        <div>
          <p className="type-field-label">Recommended Actions</p>
          <ul className="mt-2 space-y-1 text-slate-300 text-sm line-clamp-3">
            {recommendedActions.map((action, i) => (
              <li key={i} className="flex items-start gap-2">
                <AlertCircle className="size-3 mt-0.5 text-warning-400" aria-hidden />
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Safety warning */}
      <div className="pt-4 border-t border-navy-700">
        <p className="type-field-label">Important Safety Warning</p>
        <p className="type-body mt-1 text-danger-400 line-clamp-3">{safetyWarning}</p>
      </div>

      {/* Dismiss button */}
      <button
        type="button"
        onClick={onDismiss}
        className={cn(
          'mt-3 w-full rounded-lg border border-navy-700 bg-navy-900/50 px-4 py-2 text-sm font-medium text-slate-400 hover:bg-white/5 transition-colors duration-200',
        )}
        aria-label="Dismiss results"
      >
        Close
      </button>
    </div>
  )
}