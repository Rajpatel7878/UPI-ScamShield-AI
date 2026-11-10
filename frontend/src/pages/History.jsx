import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, Eye, History as HistoryIcon, RefreshCw, Trash2, X } from 'lucide-react'
import { Link } from 'react-router-dom'

import { BaseCard, Button, EmptyState, StatusBadge } from '../components/ui/index.js'
import { useAuth } from '../context/AppContext.jsx'
import { createApiClient } from '../services/apiClient.js'

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
      <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-xl border border-white/10 bg-slate-950 p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="type-label">Scan details</p>
            <h3 id="scan-detail-title" className="type-h3 mt-1">Scan #{scan.id}</h3>
            <p className="text-sm text-slate-400 mt-1">{formatDate(scan.created_at)}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close details">
            <X className="size-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-4">
          <div className="rounded-lg border border-white/10 p-3">
            <p className="text-xs text-slate-400">Risk score</p>
            <p className="text-lg font-semibold">{scan.risk_score ?? 'N/A'}/100</p>
          </div>
          <div className="rounded-lg border border-white/10 p-3">
            <p className="text-xs text-slate-400">Risk level</p>
            <div className="mt-1"><StatusBadge status={riskTone(scan.risk_level)}>{scan.risk_level || 'N/A'}</StatusBadge></div>
          </div>
          <div className="rounded-lg border border-white/10 p-3">
            <p className="text-xs text-slate-400">Category</p>
            <p className="font-medium">{scan.category || 'N/A'}</p>
          </div>
          <div className="rounded-lg border border-white/10 p-3">
            <p className="text-xs text-slate-400">Content type</p>
            <p className="font-medium">{scan.content_type || 'N/A'}</p>
          </div>
          <div className="rounded-lg border border-white/10 p-3">
            <p className="text-xs text-slate-400">Analysis type</p>
            <p className="font-medium">{scan.analysis_type || 'N/A'}</p>
          </div>
          <div className="rounded-lg border border-white/10 p-3">
            <p className="text-xs text-slate-400">Scan timestamp</p>
            <p className="font-medium">{formatDate(scan.created_at)}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-white/10 p-3">
            <p className="text-sm font-medium mb-1">Summary</p>
            <p className="text-sm text-slate-300">{scan.summary || 'No summary available.'}</p>
          </div>

          <div className="rounded-lg border border-white/10 p-3">
            <p className="text-sm font-medium mb-2">Analysis source statuses</p>
            <div className="flex flex-wrap gap-2 text-sm">
              <StatusBadge status={scan.rule_based_status === 'completed' ? 'success' : 'warning'}>Rule-based: {scan.rule_based_status || 'unknown'}</StatusBadge>
              <StatusBadge status={scan.gemini_status === 'completed' ? 'success' : 'neutral'}>Gemini: {scan.gemini_status || 'unavailable'}</StatusBadge>
              <StatusBadge status={scan.url_status === 'completed' ? 'success' : 'neutral'}>URL: {scan.url_status || 'not_applicable'}</StatusBadge>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 p-3">
            <p className="text-sm font-medium mb-2">Detection indicators</p>
            {indicators.length === 0 ? (
              <p className="text-sm text-slate-400">No indicators recorded.</p>
            ) : (
              <ul className="space-y-2">
                {indicators.map((ind, idx) => (
                  <li key={idx} className="rounded border border-white/5 p-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{ind?.name || ind?.rule_id || 'Indicator'}</span>
                      {ind?.severity ? <StatusBadge status={riskTone(ind.severity)}>{String(ind.severity)}</StatusBadge> : null}
                      {ind?.source ? <span className="text-xs text-slate-400">Source: {ind.source === 'gemini' ? 'Gemini (heuristic/contextual)' : ind.source === 'rule_based' ? 'Rule-based' : String(ind.source)}</span> : null}
                    </div>
                    <p className="text-sm text-slate-300 mt-1">{ind?.description || ind?.explanation || 'No explanation provided.'}</p>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-slate-500 mt-2">Heuristic findings should be treated as indicators, not verified proof of fraud.</p>
          </div>

          <div className="rounded-lg border border-white/10 p-3">
            <p className="text-sm font-medium mb-2">Recommendations</p>
            {recommendations.length === 0 ? (
              <p className="text-sm text-slate-400">No recommendations recorded.</p>
            ) : (
              <ul className="list-disc pl-5 space-y-1 text-sm text-slate-300">
                {recommendations.map((rec, idx) => <li key={idx}>{String(rec)}</li>)}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-4 flex justify-end">
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

  // filters
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
    setLoading(true)
    setError(null)
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
    <div className="space-y-4 p-4 sm:p-6">
      <BaseCard>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="type-label">Scan records</p>
            <h2 className="type-h2 mt-1">Scan History</h2>
            <p className="text-sm text-slate-400 mt-1">Review previous analyses and investigate saved results.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={fetchHistory} leftIcon={<RefreshCw className="size-4" />}>Refresh</Button>
            <Button variant="danger" size="sm" onClick={clearHistory} leftIcon={<Trash2 className="size-4" />} disabled={loading || (overview.total_scans || 0) === 0}>
              Clear history
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 mt-4">
          <div className="rounded-lg border border-white/10 p-3"><p className="text-xs text-slate-400">Total scans</p><p className="text-xl font-semibold">{overview.total_scans ?? 0}</p></div>
          <div className="rounded-lg border border-white/10 p-3"><p className="text-xs text-slate-400">Suspicious scans</p><p className="text-xl font-semibold">{overview.suspicious_scans ?? 0}</p></div>
          <div className="rounded-lg border border-white/10 p-3"><p className="text-xs text-slate-400">Critical scans</p><p className="text-xl font-semibold">{overview.critical_scans ?? 0}</p></div>
          <div className="rounded-lg border border-white/10 p-3"><p className="text-xs text-slate-400">Most recent scan</p><p className="text-sm font-medium">{overview.most_recent_scan_date ? formatDate(overview.most_recent_scan_date) : 'N/A'}</p></div>
        </div>
      </BaseCard>

      <BaseCard>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm">
            <span className="text-slate-400">Risk level</span>
            <select className="mt-1 w-full rounded-md border border-white/10 bg-slate-900 p-2" value={riskLevel} onChange={(e) => { setPage(1); setRiskLevel(e.target.value) }}>
              {RISK_LEVELS.map((v) => <option key={v || 'all'} value={v}>{v || 'All'}</option>)}
            </select>
          </label>
          <label className="text-sm">
            <span className="text-slate-400">Content type</span>
            <select className="mt-1 w-full rounded-md border border-white/10 bg-slate-900 p-2" value={contentType} onChange={(e) => { setPage(1); setContentType(e.target.value) }}>
              {CONTENT_TYPES.map((v) => <option key={v || 'all'} value={v}>{v || 'All'}</option>)}
            </select>
          </label>
          <label className="text-sm">
            <span className="text-slate-400">Category</span>
            <input className="mt-1 w-full rounded-md border border-white/10 bg-slate-900 p-2" value={category} onChange={(e) => { setPage(1); setCategory(e.target.value) }} placeholder="e.g. Credential Theft" />
          </label>
          <label className="text-sm">
            <span className="text-slate-400">Sort</span>
            <select className="mt-1 w-full rounded-md border border-white/10 bg-slate-900 p-2" value={sort} onChange={(e) => { setPage(1); setSort(e.target.value) }}>
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label className="text-sm">
            <span className="text-slate-400">Start date</span>
            <input type="date" className="mt-1 w-full rounded-md border border-white/10 bg-slate-900 p-2" value={startDate} onChange={(e) => { setPage(1); setStartDate(e.target.value) }} />
          </label>
          <label className="text-sm">
            <span className="text-slate-400">End date</span>
            <input type="date" className="mt-1 w-full rounded-md border border-white/10 bg-slate-900 p-2" value={endDate} onChange={(e) => { setPage(1); setEndDate(e.target.value) }} />
          </label>
          <label className="text-sm md:col-span-2">
            <span className="text-slate-400">Search (safe metadata)</span>
            <div className="mt-1 flex gap-2">
              <input className="w-full rounded-md border border-white/10 bg-slate-900 p-2" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Category, summary, risk level, type..." />
              <Button size="sm" onClick={() => { setPage(1); setSearch(searchInput) }}>Search</Button>
            </div>
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-400">
          <div>Page size:
            <select className="ml-2 rounded-md border border-white/10 bg-slate-900 p-1" value={limit} onChange={(e) => { setPage(1); setLimit(Number(e.target.value)) }}>
              {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>{pagination.total || 0} total record(s)</div>
        </div>

        {loading ? (
          <div className="mt-4 space-y-2 animate-pulse">
            <div className="h-10 rounded bg-white/5" />
            <div className="h-10 rounded bg-white/5" />
            <div className="h-10 rounded bg-white/5" />
            <div className="h-10 rounded bg-white/5" />
          </div>
        ) : error ? (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
            <p className="text-red-300">{error}</p>
            <Button className="mt-2" size="sm" variant="secondary" onClick={fetchHistory}>Retry</Button>
          </div>
        ) : items.length === 0 ? (
          <div className="mt-4">
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
            <div className="overflow-x-auto mt-4">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs text-slate-400">
                    <th scope="col" className="p-3">Scan</th>
                    <th scope="col" className="p-3">Content type</th>
                    <th scope="col" className="p-3">Risk score</th>
                    <th scope="col" className="p-3">Risk level</th>
                    <th scope="col" className="p-3">Category</th>
                    <th scope="col" className="p-3">Scan date</th>
                    <th scope="col" className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((scan) => (
                    <tr key={scan.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-3 text-sm">{shortId(scan.id)}</td>
                      <td className="p-3 text-sm">{scan.content_type || 'N/A'}</td>
                      <td className="p-3 text-sm font-medium">{scan.risk_score ?? 'N/A'}</td>
                      <td className="p-3 text-sm"><StatusBadge status={riskTone(scan.risk_level)}>{scan.risk_level || 'N/A'}</StatusBadge></td>
                      <td className="p-3 text-sm">{scan.category || 'N/A'}</td>
                      <td className="p-3 text-sm">{formatDate(scan.created_at)}</td>
                      <td className="p-3">
                        <Button size="sm" variant="secondary" onClick={() => openDetail(scan.id)} leftIcon={<Eye className="size-4" />}>
                          View details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-400">Page {pagination.page || page} of {pagination.total_pages || 0} • {pagination.total || 0} records</p>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" disabled={(pagination.page || page) <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
                <Button size="sm" variant="secondary" disabled={(pagination.total_pages || 0) === 0 || (pagination.page || page) >= (pagination.total_pages || 0)} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          </>
        )}
      </BaseCard>

      {detailLoading && !selectedScan ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"><div className="rounded bg-slate-900 p-4">Loading details…</div></div>
      ) : null}
      <ScanDetailModal scan={selectedScan} onClose={() => setSelectedScan(null)} />
    </div>
  )
}
