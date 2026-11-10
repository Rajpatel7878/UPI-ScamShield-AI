import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts'
import { ChartNoAxesColumn, RefreshCw } from 'lucide-react'

import { BaseCard, Button, EmptyState, StatusBadge } from '../components/ui/index.js'
import { useAuth } from '../context/AppContext.jsx'
import { createApiClient } from '../services/apiClient.js'

const PERIODS = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'All time', days: null },
]

const RISK_COLORS = { Low: '#22c55e', Medium: '#eab308', High: '#f97316', Critical: '#ef4444' }

function Stat({ label, value }) {
  return (
    <div className="rounded-lg border border-white/10 p-4 bg-slate-900/40">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
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
    setLoading(true)
    setError(null)
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
  const categoryData = data?.detection_category_distribution ? Object.entries(data.detection_category_distribution).map(([name, value]) => ({ name, value: Number(value || 0) })).sort((a,b)=>b.value-a.value).slice(0,8) : []
  const insights = Array.isArray(data?.security_insights) ? data.security_insights : []
  const total = Number(data?.total_scans || 0)
  const riskSummary = riskData.map((item) => `${item.name}: ${item.value}`).join(', ')
  const activitySummary = activityData.map((item) => `${item.date}: ${item.count}`).join(', ')
  const contentTypeSummary = contentTypeData.map((item) => `${item.name}: ${item.value}`).join(', ')
  const categorySummary = categoryData.map((item) => `${item.name}: ${item.value}`).join(', ')

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <BaseCard>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="type-label">Security analytics</p>
            <h2 className="type-h2 mt-1">Analytics & Trends</h2>
            <p className="text-sm text-slate-400 mt-1">Insights are calculated from your saved scan records.</p>
          </div>
          <div className="flex items-center gap-2">
            <select className="rounded-md border border-white/10 bg-slate-900 p-2 text-sm" value={days ?? ''} onChange={(e) => setDays(e.target.value === '' ? null : Number(e.target.value))}>
              {PERIODS.map((p) => <option key={p.label} value={p.days ?? ''}>{p.label}</option>)}
            </select>
            <Button variant="secondary" size="sm" onClick={() => load(days)} leftIcon={<RefreshCw className="size-4" />}>Refresh</Button>
          </div>
        </div>
      </BaseCard>

      {loading ? (
        <BaseCard>
          <div className="animate-pulse space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="h-20 rounded bg-white/5" /><div className="h-20 rounded bg-white/5" /><div className="h-20 rounded bg-white/5" /><div className="h-20 rounded bg-white/5" />
            </div>
            <div className="h-64 rounded bg-white/5" />
            <div className="h-64 rounded bg-white/5" />
          </div>
        </BaseCard>
      ) : error ? (
        <BaseCard>
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
            <p className="text-red-300">{error}</p>
            <Button className="mt-2" size="sm" variant="secondary" onClick={() => load(days)}>Retry</Button>
          </div>
        </BaseCard>
      ) : total === 0 ? (
        <BaseCard>
          <EmptyState
            icon={ChartNoAxesColumn}
            title="No analytics data"
            description="Run your first analysis to see risk distribution, trends, and security insights."
          />
        </BaseCard>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Total Scans" value={data.total_scans ?? 0} />
            <Stat label="Suspicious Scans" value={data.suspicious_scans ?? 0} />
            <Stat label="Critical Alerts" value={data.critical_alerts ?? 0} />
            <Stat label="Average Risk Score" value={data.average_risk_score ?? 0} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <BaseCard>
              <h3 className="type-h3 mb-3">Risk distribution</h3>
              <p className="sr-only">{riskSummary}</p>
              <div aria-hidden="true">
                <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={riskData} dataKey="value" nameKey="name" outerRadius={95} innerRadius={55} label>
                    {riskData.map((entry) => <Cell key={entry.name} fill={RISK_COLORS[entry.name] || '#64748b'} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              </div>
            </BaseCard>

            <BaseCard>
              <h3 className="type-h3 mb-3">Daily scan activity</h3>
              <p className="sr-only">{activitySummary}</p>
              {activityData.length === 0 ? (
                <div className="flex h-64 items-center justify-center text-sm text-slate-400">No activity data for this period.</div>
              ) : (
                <div aria-hidden="true">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="date" minTickGap={20} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#14b8a6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              )}
            </BaseCard>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <BaseCard>
              <h3 className="type-h3 mb-3">Scans by content type</h3>
              <p className="sr-only">{contentTypeSummary}</p>
              {contentTypeData.length === 0 ? (
                <div className="flex h-64 items-center justify-center text-sm text-slate-400">No content type data available.</div>
              ) : (
                <div aria-hidden="true">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={contentTypeData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#38bdf8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              )}
            </BaseCard>

            <BaseCard>
              <h3 className="type-h3 mb-3">Most common detection categories</h3>
              <p className="sr-only">{categorySummary}</p>
              {categoryData.length === 0 ? (
                <div className="flex h-64 items-center justify-center text-sm text-slate-400">No category data available.</div>
              ) : (
                <div aria-hidden="true">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" width={120} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#a78bfa" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              )}
            </BaseCard>
          </div>

          <BaseCard>
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="type-h3">Security insights</h3>
              <StatusBadge status="success">Based on actual data</StatusBadge>
            </div>
            {insights.length === 0 ? (
              <p className="text-sm text-slate-400">No insights available for this period.</p>
            ) : (
              <ul className="space-y-2">
                {insights.map((text, idx) => (
                  <li key={idx} className="rounded-lg border border-white/10 p-3 text-sm text-slate-300">{String(text)}</li>
                ))}
              </ul>
            )}
          </BaseCard>
        </>
      )}
    </div>
  )
}
