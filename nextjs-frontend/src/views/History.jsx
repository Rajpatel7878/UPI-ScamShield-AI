"use client";

import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, Eye, History as HistoryIcon, RefreshCw, Trash2, X } from 'lucide-react'
import { Link } from '@/lib/router-compat'

import { Button, EmptyState, StatusBadge } from '../components/ui/index.js'
import { useAuth } from '../context/AppContext.jsx'
import { createApiClient } from '../services/apiClient.js'
import { GlassCard } from '../components/ui/index.js'

const RISK_LEVELS = ['', 'Low', 'Medium', 'High', 'Critical']
const CONTENT_TYPES = ['', 'sms', 'whatsapp', 'payment_request', 'url', 'general']
const SORT_OPTIONS = [
  { value: 'created_at:desc', label: 'Newest first' },
  { value: 'created_at:asc', label: 'Oldest first' },
  { value: 'risk_score:desc', label: 'Highest risk first' },
  { value: 'risk_score:asc', label: 'Lowest risk first' },
]

function formatDate(value) {
  if (!value) return 'N/A'
  try {
    return new Date(value).toLocaleString()
  } catch {
    return String(value)
  }
}

function shortId(id) {
  if (id === null || id === undefined) return 'N/A'
  const s = String(id)
  return s.length > 10 ? `${s.slice(0, 8)}…` : s
}

function riskTone(level) {
  const l = String(level || '').toLowerCase()
  if (l === 'critical') return 'danger'
  if (l === 'high') return 'warning'
  if (l === 'medium') return 'brand'
  if (l === 'low') return 'success'
  return 'neutral'
}

function ScanDetailModal({ scan, onClose }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!scan) return undefined
    const previouslyFocused = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.querySelector('button')?.focus()

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus?.()
    }
  }, [scan, onClose])

  if (!scan) return null
  const indicators = Array.isArray(scan.indicators) ? scan.indicators : []
  const recommendations = Array.isArray(scan.recommendations) ? scan.recommendations : []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="scan-detail-title" ref={dialogRef}>
      <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-glow-red glass-strong">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <p className="type-label text-slate-400">Scan details</p>
            <h3 id="scan-detail-title" className="type-h2 mt-1 font-display">Scan #{scan.id}</h3>
            <p className="text-sm text-slate-500 mt-1">{formatDate(scan.created_at)}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close details">
            <X className="size-4" />
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
          <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-[0.14em]">Risk score</p>
            <p className="type-stat mt-1">{scan.risk_score ?? 'N/A'}</p>
            <p className="type-caption mt-1 text-slate-500">out of 100</p>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-[0.14em]">Risk level</p>
            <div className="mt-2">
              <StatusBadge status={riskTone(scan.risk_level)}>{scan.risk_level || 'N/A'}</StatusBadge>
            </div>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-[0.14em]">Category</p>
            <p className="mt-1 text-sm font-medium text-ink">{scan.category || 'N/A'}</p>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-[0.14em]">Content type</p>
            <p className="mt-1 text-sm font-medium text-ink">{scan.content_type || 'N/A'}</p>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-[0.14em]">Analysis type</p>
            <p className="mt-1 text-sm font-medium text-ink">{scan.analysis_type || 'N/A'}</p>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-[0.14em]">Scan timestamp</p>
            <p className="mt-1 text-sm font-medium text-ink">{formatDate(scan.created_at)}</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-white/8 bg-white/[0.02] p-5">
            <p className="type-field-label text-slate-400 mb-2">Summary</p>
            <p className="type-body text-slate-300">{scan.summary || 'No summary available.'}</p>
          </div>

          <div className="rounded-xl border border-white/8 bg-white/[0.02] p-5">
            <p className="type-field-label text-slate-400 mb-3">Analysis source statuses</p>
            <div className="flex flex-wrap gap-2 text-sm">
              <StatusBadge status={scan.rule_based_status === 'completed' ? 'success' : 'warning'}>{scan.rule_based_status || 'unknown'}</StatusBadge>
              <StatusBadge status={scan.gemini_status === 'completed' ? 'success' : 'neutral'}>{scan.gemini_status || 'unavailable'}</StatusBadge>
              <StatusBadge status={scan.url_status === 'completed' ? 'success' : 'neutral'}>{scan.url_status || 'not_applicable'}</StatusBadge>
            </div>
          </div>

          <div className="rounded-xl border border-white/8 bg-white/[0.02] p-5">
            <p className="type-field-label text-slate-400 mb-3">Detection indicators</p>
            {indicators.length === 0 ? (
              <p className="text-sm text-slate-500">No indicators recorded.</p>
            ) : (
              <ul className="space-y-3">
                {indicators.map((ind, idx) => (
                  <li key={idx} className="rounded border border-white/5 p-3">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-ink">{ind?.name || ind?.rule_id || 'Indicator'}</span>
                      {ind?.severity ? <StatusBadge status={riskTone(ind.severity)}>{String(ind.severity)}</StatusBadge> : null}
                      {ind?.source ? <span className="type-caption text-slate-500">Source: {ind.source === 'gemini' || ind.source === 'openrouter' ? 'AI' : ind.source === 'rule_based' ? 'Rule-based' : String(ind.source)}</span> : null}
                    </div>
                    <p className="type-body-sm text-slate-400 mt-1">{ind?.description || ind?.explanation || 'No explanation provided.'}</p>
                  </li>
                ))}
              </ul>
            )}
            <p className="type-caption mt-2 text-slate-500">Heuristic findings should be treated as indicators, not verified proof of fraud.</p>
          </div>

          <div className="rounded-xl border border-white/8 bg-white/[0.02] p-5">
            <p className="type-field-label text-slate-400 mb-3">Recommendations</p>
            {recommendations.length === 0 ? (
              <p className="text-sm text-slate-500">No recommendations recorded.</p>
            ) : (
              <ul className="space-y-2">
                {recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 p-2 rounded-lg border border-white/5 bg-white/[0.02] text-sm text-slate-300">
                    <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-slate-500" aria-hidden="true" />
                    <span>{String(rec)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="secondary" onClick={onClose}>Back to history</Button>
        </div>
      </div>
    </div>
  )
}

export default function HistoryPage() {
  const { isAuthenticated } = useAuth()
  const api = useMemo(() => createApiClient(), [])

  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, total_pages: 0 })
  const [overview, setOverview] = useState({ total_scans: 0, suspicious_scans: 0, critical_scans: 0, most_recent_scan_date: null })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedScan, setSelectedScan] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [riskLevel, setRiskLevel] = useState('')
  const [contentType, setContentType] = useState('')
  const [category, setCategory] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [sort, setSort] = useState('created_at:desc')

  const fetchHistory = async () => {
    try {
      const [sort_by, sort_order] = sort.split(':')
      const params = { page, limit, sort_by, sort_order }
      if (riskLevel) params.risk_level = riskLevel
      if (contentType) params.content_type = contentType
      if (category.trim()) params.category = category.trim()
      if (startDate) params.start_date = startDate
      if (endDate) params.end_date = endDate
      if (search.trim()) params.search = search.trim()
      const res = await api.get('/detect/history', { params })
      const data = res.data || {}
      setItems(Array.isArray(data.items) ? data.items : (Array.isArray(data.scans) ? data.scans : []))
      setPagination(data.pagination || { page, limit, total: 0, total_pages: 0 })
      setOverview(data.overview || { total_scans: 0, suspicious_scans: 0, critical_scans: 0, most_recent_scan_date: null })
    } catch (err) {
      setError(err?.message || 'Failed to load scan history.')
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return
    fetchHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, page, limit, riskLevel, contentType, category, startDate, endDate, search, sort])

  if (!isAuthenticated) return null

  const openDetail = async (id) => {
    setDetailLoading(true)
    setError(null)
    try {
      const res = await api.get(`/detect/history/${id}`)
      setSelectedScan(res.data?.scan || null)
    } catch (err) {
      setError(err?.message || 'Failed to load scan details.')
    } finally {
      setDetailLoading(false)
    }
  }

  const clearHistory = async () => {
    if (!window.confirm('Delete all your scan history? This cannot be undone.')) return
    try {
      await api.delete('/detect/history')
      setPage(1)
      await fetchHistory()
    } catch (err) {
      setError(err?.message || 'Failed to delete scan history.')
    }
  }

  const hasFilters = !!(riskLevel || contentType || category || startDate || endDate || search)

  return (
    <div className="relative p-4 sm:p-6">
      <GlassCard className="mb-6 neon-border-red">
        <div className="flex flex-wrap items-start justify-between gap-4 p-6">
          <div>
            <p className="type-label text-slate-400">Scan records</p>
            <h2 className="type-h2 mt-1 font-display">Scan History</h2>
            <p className="type-caption mt-1 text-slate-500">Review previous analyses and investigate saved results.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" size="sm" onClick={fetchHistory} leftIcon={<RefreshCw className="size-4" />}>
              Refresh
            </Button>
            <Button variant="danger" size="sm" onClick={clearHistory} leftIcon={<Trash2 className="size-4" />} disabled={loading || (overview.total_scans || 0) === 0}>
              Clear history
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-6 p-6">
          <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-[0.14em]">Total scans</p>
            <p className="type-stat mt-1">{overview.total_scans ?? 0}</p>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-[0.14em]">Suspicious scans</p>
            <p className="type-stat mt-1 text-warning-500">{overview.suspicious_scans ?? 0}</p>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-[0.14em]">Critical scans</p>
            <p className="type-stat mt-1 text-red-500">{overview.critical_scans ?? 0}</p>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-[0.14em]">Most recent scan</p>
            <p className="type-body-sm mt-1 font-medium text-ink">{overview.most_recent_scan_date ? formatDate(overview.most_recent_scan_date) : 'N/A'}</p>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="neon-border-blue">
        <div className="p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-[0.14em] block mb-2">
              Risk level
            </label>
            <select className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20" value={riskLevel} onChange={(e) => { setPage(1); setRiskLevel(e.target.value) }}>
              {RISK_LEVELS.map((v) => <option key={v || 'all'} value={v}>{v || 'All'}</option>)}
            </select>

            <label className="text-xs font-medium text-slate-400 uppercase tracking-[0.14em] block mb-2">
              Content type
            </label>
            <select className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20" value={contentType} onChange={(e) => { setPage(1); setContentType(e.target.value) }}>
              {CONTENT_TYPES.map((v) => <option key={v || 'all'} value={v}>{v || 'All'}</option>)}
            </select>

            <label className="text-xs font-medium text-slate-400 uppercase tracking-[0.14em] block mb-2">
              Category
            </label>
            <input className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20" value={category} onChange={(e) => { setPage(1); setCategory(e.target.value) }} placeholder="e.g. Credential Theft" />

            <label className="text-xs font-medium text-slate-400 uppercase tracking-[0.14em] block mb-2">
              Sort
            </label>
            <select className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20" value={sort} onChange={(e) => { setPage(1); setSort(e.target.value) }}>
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            <label className="text-xs font-medium text-slate-400 uppercase tracking-[0.14em] block mb-2">
              Start date
            </label>
            <input type="date" className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20" value={startDate} onChange={(e) => { setPage(1); setStartDate(e.target.value) }} />

            <label className="text-xs font-medium text-slate-400 uppercase tracking-[0.14em] block mb-2">
              End date
            </label>
            <input type="date" className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20" value={endDate} onChange={(e) => { setPage(1); setEndDate(e.target.value) }} />

            <label className="text-xs font-medium text-slate-400 uppercase tracking-[0.14em] block mb-2 lg:col-span-2">
              Search (safe metadata)
            </label>
            <div className="mt-1 flex gap-2 lg:col-span-2">
              <input className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Category, summary, risk level, type..." />
              <Button size="sm" onClick={() => { setPage(1); setSearch(searchInput) }}>Search</Button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500">
            <div>Page size:
              <select className="ml-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-300 focus:border-red-500/50" value={limit} onChange={(e) => { setPage(1); setLimit(Number(e.target.value)) }}>
                {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>{pagination.total || 0} total record(s)</div>
          </div>

          {loading ? (
            <div className="mt-6 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 rounded-xl bg-gradient-to-r from-white/5 via-white/10 to-white/5 animate-shimmer" />
              ))}
            </div>
          ) : error ? (
            <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/5 p-4">
              <p className="text-red-300">{error}</p>
              <Button className="mt-3" size="sm" variant="secondary" onClick={fetchHistory}>Retry</Button>
            </div>
          ) : items.length === 0 ? (
            <div className="mt-6">
              {hasFilters ? (
                <EmptyState
                  icon={HistoryIcon}
                  title="No matching results"
                  description="No scans match the selected filters. Try adjusting or clearing filters."
                  action={<Button size="sm" variant="secondary" onClick={() => { setRiskLevel(''); setContentType(''); setCategory(''); setStartDate(''); setEndDate(''); setSearch(''); setSearchInput(''); setPage(1) }}>Clear filters</Button>}
                />
              ) : (
                <EmptyState
                  icon={HistoryIcon}
                  title="No scans yet"
                  description="No detection results have been saved yet. Run your first analysis to see results here."
                  action={<Button as={Link} to="/detect" size="sm" rightIcon={<ArrowRight className="size-4" aria-hidden="true" />}>Open detection workspace</Button>}
                />
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto mt-6">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-white/8 text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      <th scope="col" className="p-4">Scan</th>
                      <th scope="col" className="p-4">Content type</th>
                      <th scope="col" className="p-4">Risk score</th>
                      <th scope="col" className="p-4">Risk level</th>
                      <th scope="col" className="p-4">Category</th>
                      <th scope="col" className="p-4">Scan date</th>
                      <th scope="col" className="p-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((scan) => (
                      <tr key={scan.id} className="border-b border-white/5 hover:bg-white/5 transition-colors duration-200">
                        <td className="p-4 text-sm">{shortId(scan.id)}</td>
                        <td className="p-4 text-sm">{scan.content_type || 'N/A'}</td>
                        <td className="p-4 text-sm font-medium text-ink">{scan.risk_score ?? 'N/A'}</td>
                        <td className="p-4 text-sm"><StatusBadge status={riskTone(scan.risk_level)}>{scan.risk_level || 'N/A'}</StatusBadge></td>
                        <td className="p-4 text-sm text-slate-300">{scan.category || 'N/A'}</td>
                        <td className="p-4 text-sm text-slate-400">{formatDate(scan.created_at)}</td>
                        <td className="p-4">
                          <Button size="sm" variant="secondary" onClick={() => openDetail(scan.id)} leftIcon={<Eye className="size-4" />}>
                            View details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <p className="type-caption">Page {pagination.page || page} of {pagination.total_pages || 0} • {pagination.total || 0} records</p>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="secondary" disabled={(pagination.page || page) <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
                  <Button size="sm" variant="secondary" disabled={(pagination.total_pages || 0) === 0 || (pagination.page || page) >= (pagination.total_pages || 0)} onClick={() => setPage((p) => p + 1)}>Next</Button>
                </div>
              </div>
            </>
          )}
        </div>
      </GlassCard>

      {detailLoading && !selectedScan ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"><div className="rounded-xl bg-white/5 p-4">Loading details…</div></div>
      ) : null}
      <ScanDetailModal scan={selectedScan} onClose={() => setSelectedScan(null)} />
    </div>
  )
}
