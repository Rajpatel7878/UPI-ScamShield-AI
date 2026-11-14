"use client";

import { cn } from '../../utils/cn.js'

const TONES = {
  low: 'text-success-400',
  medium: 'text-warning-400',
  high: 'text-danger-400',
  critical: 'text-danger-500',
  brand: 'text-brand-400',
}

/**
 * Illustrative score dial used by the landing page previews. This is a visual
 * component only — it never renders a live assessment.
 */
export function ScoreRing({
  value,
  size = 104,
  strokeWidth = 8,
  tone = 'high',
  label = 'Example risk score',
  className,
}) {
  const safeValue = Math.min(Math.max(Number(value) || 0, 0), 100)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - safeValue / 100)

  return (
    <div
      className={cn('relative shrink-0', className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`${label}: ${safeValue} out of 100`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-white/10"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className={cn(
            'transition-[stroke-dashoffset] duration-700 ease-out',
            TONES[tone] ?? TONES.high,
          )}
        />
      </svg>
      <div
        aria-hidden="true"
        className="absolute inset-0 flex flex-col items-center justify-center"
      >
        <span className="font-mono text-2xl font-semibold tabular-nums text-ink">
          {safeValue}
        </span>
        <span className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
          / 100
        </span>
      </div>
    </div>
  )
}
