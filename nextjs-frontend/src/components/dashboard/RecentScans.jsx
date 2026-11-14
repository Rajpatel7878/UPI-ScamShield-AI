"use client";

import { Clock } from 'lucide-react'
import { Link } from '@/lib/router-compat'
import { BaseCard, Button, EmptyState, StatusBadge } from '../ui/index.js'

function formatDate(value) {
  if (!value) return 'N/A'
  try {
    return new Date(value).toLocaleString()
  } catch {
    return String(value)
  }
}

export function RecentScans({ scans }) {
  const items = Array.isArray(scans) ? scans : []

  return (
    <BaseCard className="mt-6">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <p className="type-label">Recent activity</p>
          <h3 className="type-h3 mt-1">Recent Scans</h3>
        </div>
        <Button as={Link} to="/history" size="sm" variant="secondary">View all</Button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No scan records yet"
          description="Analyze messages to populate your recent scan activity."
          action={<Button as={Link} to="/detect" size="sm">Open detection workspace</Button>}
        />
      ) : (
        <div className="space-y-2">
          {items.map((scan) => (
            <div key={scan.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 p-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">Scan #{scan.id} • {scan.content_type || 'unknown'}</p>
                <p className="text-xs text-slate-400 truncate">{scan.summary || scan.category || 'No summary'}</p>
                <p className="text-xs text-slate-500 mt-1">{formatDate(scan.created_at)}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{scan.risk_score ?? 0}/100</span>
                <StatusBadge status={String(scan.risk_level || '').toLowerCase() === 'critical' ? 'danger' : String(scan.risk_level || '').toLowerCase() === 'high' ? 'warning' : String(scan.risk_level || '').toLowerCase() === 'medium' ? 'brand' : 'success'}>
                  {scan.risk_level || 'N/A'}
                </StatusBadge>
              </div>
            </div>
          ))}
        </div>
      )}
    </BaseCard>
  )
}
