"use client";

import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts'
import { ChartNoAxesColumn, RefreshCw } from 'lucide-react'

import { Button, EmptyState, StatusBadge } from '../components/ui/index.js'
import { useAuth } from '../context/AppContext.jsx'
import { createApiClient } from '../services/apiClient.js'
import { GlassCard } from '../components/ui/index.js'

const PERIODS = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'All time', days: null },
]

const RISK_COLORS = {
  Low: '#22c55e',
  Medium: '#f59e0b',
  High: '#ef4444',
  Critical: '#ff365d',
}

function Stat({ label, value, tone = 'brand' }) {
  const toneStyles = {
    brand: 'text-blue-300 ring-blue-500/20',
    success: 'text-success-500 ring-success-500/20',
    warning: 'text-warning-500 ring-warning-500/20',
    danger: 'text-red-500 ring-red-500/20',
  }
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-5 glass">
      <div className="flex items-start justify-between gap-3">
        <p className="type-label text-slate-400">{label}</p>
        <span className={`inline-flex size-9 shrink-0 items-center justify-center rounded-xl ${toneStyles[tone]}`}>
          <span className="size-4" aria-hidden="true" />
        </span>
      </div>
      <p className="type-stat mt-2">{value}</p>
    </div>
  )
}

export default function AnalyticsPage() {
  const { isAuthenticated } = useAuth()
  const api = useMemo(() => createApiClient(), [])
  const [days, setDays] = useState(30)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async (selectedDays = days) => {
    try {
      const params = selectedDays ? { days: selectedDays } : {}
      const res = await api.get('/analytics/overview', { params })
      setData(res.data || null)
    } catch (err) {
      setError(err?.message || 'Failed to load analytics data.')
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return
    load(days)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, days])

  if (!isAuthenticated) return null

  const riskData = data ? ['Low', 'Medium', 'High', 'Critical'].map((k) => ({ name: k, value: Number(data.risk_distribution?.[k] || 0) })) : []
  const activityData = Array.isArray(data?.daily_scan_activity) ? data.daily_scan_activity.map((d) => ({ date: d.date, count: Number(d.count || 0) })) : []
  const contentTypeData = data?.content_type_distribution ? Object.entries(data.content_type_distribution).map(([name, value]) => ({ name, value: Number(value || 0) })) : []
  const categoryData = data?.detection_category_distribution ? Object.entries(data.detection_category_distribution).map(([name, value]) => ({ name, value: Number(value || 0) })).sort((a, b) => b.value - a.value).slice(0, 8) : []
  const insights = Array.isArray(data?.security_insights) ? data.security_insights : []
  const total = Number(data?.total_scans || 0)

  return (
    <div className="relative p-4 sm:p-6">
      <GlassCard className="mb-6 neon-border-red">
        <div className="flex flex-wrap items-start justify-between gap-4 p-6">
          <div>
            <p className="type-label text-slate-400">Security analytics</p>
            <h2 className="type-h2 mt-1 font-display">Analytics & Trends</h2>
            <p className="type-caption mt-1 text-slate-500">Insights are calculated from your saved scan records.</p>
          </div>
          <div className="flex items-center gap-3">
            <select className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20" value={days ?? ''} onChange={(e) => setDays(e.target.value === '' ? null : Number(e.target.value))}>
              {PERIODS.map((p) => <option key={p.label} value={p.days ?? ''}>{p.label}</option>)}
            </select>
            <Button variant="secondary" size="sm" onClick={() => load(days)} leftIcon={<RefreshCw className="size-4" />}>
              Refresh
            </Button>
          </div>
        </div>
      </GlassCard>

      {loading ? (
        <GlassCard>
          <div className="animate-shimmer space-y-4 p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 rounded-xl bg-gradient-to-r from-white/5 via-white/10 to-white/5" />
              ))}
            </div>
            <div className="h-64 rounded-xl bg-gradient-to-r from-white/5 via-white/10 to-white/5" />
            <div className="h-64 rounded-xl bg-gradient-to-r from-white/5 via-white/10 to-white/5" />
          </div>
        </GlassCard>
      ) : error ? (
        <GlassCard className="neon-border-red">
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6">
            <p className="text-red-300">{error}</p>
            <Button className="mt-3" size="sm" variant="secondary" onClick={() => load(days)}>Retry</Button>
          </div>
        </GlassCard>
      ) : total === 0 ? (
        <GlassCard>
          <EmptyState
            icon={ChartNoAxesColumn}
            title="No analytics data"
            description="Run your first analysis to see risk distribution, trends, and security insights."
          />
        </GlassCard>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <Stat label="Total Scans" value={data.total_scans ?? 0} tone="brand" />
            <Stat label="Suspicious Scans" value={data.suspicious_scans ?? 0} tone="warning" />
            <Stat label="Critical Alerts" value={data.critical_alerts ?? 0} tone="danger" />
            <Stat label="Average Risk Score" value={data.average_risk_score ?? 0} tone="success" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2 mb-8">
            <GlassCard className="neon-border-red">
              <div className="p-6">
                <h3 className="type-h3 mb-4">Risk distribution</h3>
                <div aria-hidden="true">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={riskData} dataKey="value" nameKey="name" outerRadius={95} innerRadius={55} label>
                        {riskData.map((entry) => <Cell key={entry.name} fill={RISK_COLORS[entry.name] || '#6b7280'} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="neon-border-blue">
              <div className="p-6">
                <h3 className="type-h3 mb-4">Daily scan activity</h3>
                {activityData.length === 0 ? (
                  <div className="flex h-64 items-center justify-center text-sm text-slate-500">No activity data for this period.</div>
                ) : (
                  <div aria-hidden="true">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={activityData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="date" minTickGap={20} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Line type="monotone" dataKey="count" stroke="#4285ff" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 mb-8">
            <GlassCard className="neon-border-red">
              <div className="p-6">
                <h3 className="type-h3 mb-4">Scans by content type</h3>
                {contentTypeData.length === 0 ? (
                  <div className="flex h-64 items-center justify-center text-sm text-slate-500">No content type data available.</div>
                ) : (
                  <div aria-hidden="true">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={contentTypeData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#4285ff" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </GlassCard>

            <GlassCard className="neon-border-blue">
              <div className="p-6">
                <h3 className="type-h3 mb-4">Most common detection categories</h3>
                {categoryData.length === 0 ? (
                  <div className="flex h-64 items-center justify-center text-sm text-slate-500">No category data available.</div>
                ) : (
                  <div aria-hidden="true">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={categoryData} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis type="category" dataKey="name" width={120} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#d946ef" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>

          <GlassCard className="mb-8">
            <div className="flex items-center justify-between gap-2 mb-4 p-6">
              <h3 className="type-h3">Security insights</h3>
              <StatusBadge status="success">Based on actual data</StatusBadge>
            </div>
            {insights.length === 0 ? (
              <p className="text-sm text-slate-500 p-6">No insights available for this period.</p>
            ) : (
              <ul className="space-y-3 p-6">
                {insights.map((text, idx) => (
                  <li key={idx} className="rounded-xl border border-white/8 bg-white/[0.02] p-4 text-sm text-slate-300 leading-relaxed">{String(text)}</li>
                ))}
              </ul>
            )}
          </GlassCard>
        </>
      )}
    </div>
  )
}
