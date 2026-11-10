import { useEffect, useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'

import {
  ActivityChart,
  DashboardStatsCard,
  QuickActions,
  RecentScans,
  RiskDistributionChart,
  RiskInsights,
} from '../components/dashboard/index.js'
import { BaseCard, EmptyState } from '../components/ui/index.js'
import { useAuth } from '../context/AppContext.jsx'
import { createApiClient } from '../services/apiClient.js'

export default function Dashboard() {
  const { isAuthenticated, user } = useAuth()
  const api = useMemo(() => createApiClient(), [])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentDate, setCurrentDate] = useState('')

  useEffect(() => {
    setCurrentDate(
      new Date().toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    )
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get('/dashboard/stats')
      setStats(response.data || null)
    } catch (err) {
      setError(err?.message || 'Failed to load dashboard statistics.')
      setStats(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return
    fetchStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  if (!isAuthenticated) return null

  const totalScans = Number(stats?.total_scans || 0)
  const suspicious = Number(stats?.suspicious_scans || 0)
  const critical = Number(stats?.critical_alerts || 0)
  const avgRisk = Number(stats?.average_risk_score || 0)
  const isEmpty = totalScans === 0

  return (
    <div>
      <header>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="type-body text-slate-400">Welcome back{user?.name ? `, ${user.name}` : ''}.</p>
            <p className="type-body text-slate-400">{currentDate}</p>
            <button
              onClick={fetchStats}
              className="inline-flex items-center rounded-lg border border-white/10 bg-transparent px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-white/5"
              aria-label="Refresh dashboard data"
            >
              <RefreshCw className={`mr-1.5 size-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
              Refresh
            </button>
          </div>
        </div>
      </header>

      {error ? (
        <BaseCard className="mt-6">
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
            <p className="text-red-300">{error}</p>
            <button className="mt-2 underline text-sm" onClick={fetchStats}>Retry</button>
          </div>
        </BaseCard>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-6">
        <DashboardStatsCard label="Total Scans" value={totalScans} description="All saved analyses" tone="brand" />
        <DashboardStatsCard label="Suspicious Scans" value={suspicious} description="Medium, high, or critical" tone="warning" />
        <DashboardStatsCard label="Critical Alerts" value={critical} description="Critical risk results" tone="danger" />
        <DashboardStatsCard label="Average Risk Score" value={avgRisk} description="Across selected records" tone="neutral" />
      </div>

      {isEmpty && !loading ? (
        <BaseCard className="mt-6">
          <EmptyState
            title="No scan data yet"
            description="Run your first analysis to populate dashboard statistics, recent scans, and insights."
          />
        </BaseCard>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mt-6">
            <BaseCard>
              <h3 className="type-h3 mb-3">Risk Distribution</h3>
              <RiskDistributionChart distribution={stats?.risk_distribution} />
            </BaseCard>
            <BaseCard>
              <h3 className="type-h3 mb-3">Scan Activity</h3>
              <ActivityChart daily_scan_activity={stats?.daily_scan_activity} recent_activity={stats?.recent_activity} />
            </BaseCard>
          </div>

          <RecentScans scans={stats?.recent_scans} />
          <RiskInsights insights={stats?.risk_insights || stats?.security_insights} />
        </>
      )}

      <QuickActions />
    </div>
  )
}
