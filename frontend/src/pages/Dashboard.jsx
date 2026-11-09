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

import { STATS_CARDS } from '../mock-data/dashboard.js'
import { Button } from '../components/ui/Button.jsx'

/** Dashboard page. */
export default function Dashboard() {
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

  // Simulate a refresh interaction — UI only, no real data fetch
  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1200)
  }

  return (
    <AppLayout>
      {/* Demo data label */}
      <p className="mt-3 text-xs text-slate-500">
        <span className="font-medium">Demo Data</span> — All values and charts are
        illustrative and do not represent real user data until backend integration.
      </p>

      {/* Security Overview Header */}
      <header className="pt-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="type-h2 mb-1">Security Overview</h2>
          <p className="type-body text-muted mb-4">
            Monitor suspicious activity, review risk insights, and stay informed
            about your digital payment security.
          </p>

          {/* Welcome message + date + refresh + analyze button */}
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

            <Button
              as={RouterLink}
              to="/detect"
              size="sm"
              variant="primary"
              rightIcon={<ShieldCheck className="size-4" aria-hidden="true" />}
            >
              Analyze Content
            </Button>
          </div>
        </div>
      </header>

      {/* Statistics Cards Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-6">
        {STATS_CARDS.map((card) => (
          <DashboardStatsCard
            key={card.id}
            label={card.label}
            value={card.value}
            description={card.description}
            icon={card.icon}
            tone={card.tone}
          />
        ))}
      </div>

      {/* Risk Distribution + Activity Charts Row (desktop: side-by-side, mobile: stacked) */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-6">
        <RiskDistributionChart />
        <ActivityChart />
      </div>

      {/* Recent Scan Activity */}
      <RecentScans />

      {/* Risk Insights Panel */}
      <RiskInsights />

      {/* Quick Actions */}
      <QuickActions />
    </AppLayout>
  )
}