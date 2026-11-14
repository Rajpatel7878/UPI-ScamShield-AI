"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { RefreshCw } from 'lucide-react'
import { Link } from '@/lib/router-compat'

import {
  ActivityChart,
  DashboardStatsCard,
  QuickActions,
  RecentScans,
  RiskDistributionChart,
  RiskInsights,
} from '../components/dashboard/index.js'
import { GlassCard } from '../components/ui/index.js'
import { useAuth } from '../context/AppContext.jsx'
import { createApiClient } from '../services/apiClient.js'

function subscribeToNothing() {
  return () => {}
}

function getCurrentDate() {
  return new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function Dashboard() {
  const { isAuthenticated, user } = useAuth()
  const api = useMemo(() => createApiClient(), [])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const currentDate = useSyncExternalStore(
    subscribeToNothing,
    getCurrentDate,
    () => '',
  )

  const fetchStats = async () => {
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
  const safeMessages = Math.max(totalScans - suspicious, 0)
  const isEmpty = totalScans === 0

  return (
    <div className="relative">
      <header className="mb-8 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="type-body-sm flex items-center gap-2 text-slate-400">
                <span className="inline-flex size-6 items-center justify-center rounded-lg bg-blue-500/10 text-blue-300">
                  <RefreshCw className="size-3.5" aria-hidden="true" />
                </span>
                Welcome back{user?.name ? `, ${user.name}` : ''}.
              </p>
              <p className="type-body text-slate-300">{currentDate}</p>
            </div>
            <button
              onClick={fetchStats}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
              aria-label="Refresh dashboard data"
            >
              <RefreshCw
                className={`size-4 ${loading ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              Refresh
            </button>
          </div>
        </div>
      </header>

      {error ? (
        <GlassCard className="mt-6 mx-auto max-w-2xl neon-border-red">
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6">
            <p className="text-red-300">{error}</p>
            <button
              className="mt-3 inline-flex items-center gap-2 underline underline-offset-4 text-sm text-red-300 hover:text-red-400"
              onClick={fetchStats}
            >
              <RefreshCw className="size-4" aria-hidden="true" /> Retry
            </button>
          </div>
        </GlassCard>
      ) : null}

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <DashboardStatsCard
          label="Total Scans"
          value={totalScans}
          description="All saved analyses"
          tone="brand"
          className="flex-1"
        />
        <DashboardStatsCard
          label="Suspicious Detected"
          value={suspicious}
          description="Medium, high, or critical risk"
          tone="warning"
          className="flex-1"
        />
        <DashboardStatsCard
          label="Critical Alerts"
          value={critical}
          description="Critical risk results"
          tone="danger"
          className="flex-1"
        />
        <DashboardStatsCard
          label="Safe Messages"
          value={safeMessages}
          description="Low-risk analyses"
          tone="success"
          className="flex-1"
        />
      </div>

      {/* Average risk score highlight */}
      <GlassCard className="mb-8 neon-border-blue">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-5">
          <div>
            <p className="type-label">Average Risk Score</p>
            <p className="type-stat mt-1">{avgRisk.toFixed(1)}</p>
            <p className="type-caption mt-1 text-slate-500">
              Across {totalScans} saved analyses
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-24 h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-magenta-500 to-red-500"
                style={{ width: `${Math.min(Math.max(avgRisk, 0), 100)}%` }}
              />
            </div>
            <span className="type-caption text-slate-400">
              {avgRisk < 30 ? 'Low risk environment' : avgRisk < 60 ? 'Moderate risk environment' : 'Elevated risk environment'}
            </span>
          </div>
        </div>
      </GlassCard>

      {isEmpty && !loading ? (
        <GlassCard className="mt-6 mx-auto max-w-3xl">
          <div className="text-center py-12">
            <div className="inline-flex size-16 items-center justify-center rounded-full bg-white/5 mb-4 text-slate-500">
              <RefreshCw className="size-8" aria-hidden="true" />
            </div>
            <h3 className="type-h2 mb-3">No scan data yet</h3>
            <p className="type-body text-slate-400 mb-6 max-w-sm mx-auto">
              Run your first analysis to populate dashboard statistics, recent
              scans, and security insights.
            </p>
            <div className="flex justify-center">
              <button
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-medium text-slate-300 transition-all hover:bg-white/10 hover:border-white/20 hover:-translate-y-0.5"
              >
                <RefreshCw className="size-4" aria-hidden="true" /> Open detection workspace
              </button>
            </div>
          </div>
        </GlassCard>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-2 mb-8">
            <GlassCard className="neon-border-red">
              <div className="p-6">
                <h3 className="type-h3 mb-4">Risk Distribution</h3>
                <RiskDistributionChart
                  distribution={stats?.risk_distribution}
                />
              </div>
            </GlassCard>

            <GlassCard className="neon-border-blue">
              <div className="p-6">
                <h3 className="type-h3 mb-4">Scan Activity</h3>
                <ActivityChart
                  daily_scan_activity={stats?.daily_scan_activity}
                  recent_activity={stats?.recent_activity}
                />
              </div>
            </GlassCard>
          </div>

          <div className="grid gap-6 lg:grid-cols-3 mb-8">
            <GlassCard className="col-span-2 lg:col-span-2">
              <div className="flex items-center justify-between gap-3 mb-4 p-6">
                <div>
                  <p className="type-label">Recent Threats</p>
                  <h3 className="type-h3 mt-1">Recent Scans</h3>
                </div>
                <button
                  as={Link}
                  to="/history"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10"
                >
                  View all <span className="text-slate-500">→</span>
                </button>
              </div>
              <RecentScans scans={stats?.recent_scans} />
            </GlassCard>

            <GlassCard>
              <div className="p-6">
                <h3 className="type-h3 mb-4">Security Insights</h3>
                <RiskInsights
                  insights={stats?.risk_insights || stats?.security_insights}
                />
              </div>
            </GlassCard>
          </div>

          <GlassCard className="mb-8">
            <QuickActions />
          </GlassCard>
        </>
      )}
    </div>
  )
}
