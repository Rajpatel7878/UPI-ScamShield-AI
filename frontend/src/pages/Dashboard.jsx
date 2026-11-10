import { ShieldCheck } from 'lucide-react'
import { useState, useEffect } from 'react'

import { AppLayout } from '../components/layout/AppLayout.jsx'
import {
  DashboardStatsCard,
  RiskDistributionChart,
  ActivityChart,
  RecentScans,
  RiskInsights,
  QuickActions,
} from '../components/dashboard/index.js'

import { useAuth } from '../context/AppContext.js'
import { createApiClient } from '../services/apiClient.js'

/** Dashboard page. */
export default function Dashboard() {
  const { user, isAuthenticated } = useAuth()
  const api = createApiClient()

  const [stats, setStats] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [currentDate, setCurrentDate] = useState('')

  // Set date once on mount
  useEffect(() => {
    const date = new Date()
    setCurrentDate(
      date.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    )
  }, [])

  // Fetch statistics from backend
  useEffect(() => {
    if (!isAuthenticated) return

    const fetchStats = async () => {
      setRefreshing(true)
      try {
        const response = await api.get('/dashboard/stats')
        setStats(response.data)
      } catch (err) {
        const message =
          err.response?.data?.detail ||
          err.message ||
          'Failed to load dashboard statistics.'
        alert(message)
      } finally {
        setRefreshing(false)
      }
    }

    fetchStats()
  }, [isAuthenticated])

  // Simulate a refresh interaction — UI only; real refresh re-fetches data
  const handleRefresh = () => {
    setRefreshing(true)
    // Re-fetch stats in addition to the skeleton animation
    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard/stats')
        setStats(response.data)
      } catch (err) {
        // swallow fetch errors during animation
      }
    }
    fetchStats()
    setTimeout(() => setRefreshing(false), 1200)
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <AppLayout>
      {/* Security Overview Header */}
      <header className="pt-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="type-h2 mb-1">Security Overview</h2>
          <p className="type-body text-muted mb-4">
            Monitor suspicious activity, review risk insights, and stay informed
            about your digital payment security.
          </p>

          {/* Welcome message + date + refresh */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-2">
            <p className="type-body text-slate-400">Welcome back.</p>
            <p className="type-body text-slate-400 sm:ml-4">{currentDate}</p>
            <button
              onClick={handleRefresh}
              className={cn(
                'inline-flex items-center rounded-lg border border-navy-700 bg-transparent px-3 py-1.5 text-sm font-medium text-slate-400 hover:bg-white/5 transition-colors duration-200',
                refreshing && 'animate-spin',
              )}
              aria-label="Refresh dashboard data"
            >
              {refreshing ? (
                <span className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <ShieldCheck className="size-4 mr-1.5" aria-hidden="true" />
              )}
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Statistics Cards Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-6">
        {stats && stats.risk_distribution
          ? Object.entries(stats.risk_distribution).map(([riskLevel, count]) => (
              <DashboardStatsCard
                key={riskLevel}
                label={riskLevel}
                value={count || 0}
                description={'Scans at this risk level'}
                icon='ShieldCheck'
                tone='neutral'
              />
            ))
          : (
              <DashboardStatsCard
                label='Total Scans'
                value={stats ? stats.total_scans || 0 : 0}
                description={'No scan data available'}
                icon='Clock'
                tone='neutral'
              />
            )}
      </div>

      {/* Risk Distribution + Activity Charts Row (desktop: side-by-side, mobile: stacked) */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-6">
        {stats && stats.risk_distribution
          ? (
              <>
                <RiskDistributionChart
                  distribution={stats.risk_distribution}
                />
                <ActivityChart
                  recent_activity={stats.recent_activity || []}
                />
              </>
            )
          : (
              <RiskDistributionChart />
              <ActivityChart />
            )}
      </div>

      {/* Recent Scan Activity */}
      {stats && stats.recent_scans
        ? <RecentScans scans={stats.recent_scans} />
        : <RecentScans />}

      {/* Risk Insights Panel */}
      {stats && stats.risk_insights
        ? <RiskInsights insights={stats.risk_insights} />
        : <RiskInsights />}

      {/* Quick Actions */}
      <QuickActions />
    </AppLayout>
  )
}