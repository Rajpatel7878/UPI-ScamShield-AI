import { ArrowRight, History as HistoryIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BaseCard, Button, EmptyState, StatusBadge, Pagination } from '../components/ui/index.js'

import { useAuth } from '../context/AppContext.js'
import { createApiClient } from '../services/apiClient.js'

function History({ initialPage, initialPageSize }) {
  const { user, isAuthenticated } = useAuth()
  const api = createApiClient()

  const [scans, setScans] = useState([])
  const [page, setPage] = useState(initialPage || 1)
  const [pageSize, setPageSize] = useState(initialPageSize || 10)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch scan history from backend
  useEffect(() => {
    if (!isAuthenticated) return

    const fetchScans = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await api.get('/detect/history', {
          params: { page, page_size: pageSize },
        })
        setScans(response.data.scans || [])
        // We don't set total here since pagination info may vary
      } catch (err) {
        const message =
          err.response?.data?.detail ||
          err.message ||
          'Failed to load scan history.'
        setError(message)
        alert(message)
      } finally {
        setLoading(false)
      }
    }

    fetchScans()
  }, [isAuthenticated, page, pageSize])

  const handlePageChange = async (newPage) => {
    setPage(newPage)
    await fetchScans()
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <BaseCard>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="type-label">Scan records</p>
          <h2 className="type-h2 mt-1">Scan History</h2>
        </div>
        <StatusBadge status="connected">Connected</StatusBadge>
      </div>

      {loading ? (
        <div className="mt-4 py-4">
          <span className="text-muted">Loading scans...</span>
        </div>
      ) : error ? (
        <div className="mt-4 py-4">
          <p className="text-danger">{error}</p>
        </div>
      ) : scans.length === 0 ? (
        <EmptyState
          icon={HistoryIcon}
          title="No scans yet"
          description="No detection results have been saved yet. Run your first analysis to see results here."
          action={
            <Button
              as={Link}
              to="/detect"
              size="sm"
              rightIcon={<ArrowRight className="size-4" aria-hidden="true" />}
            >
              Open detection workspace
            </Button>
          }
        />
      ) : (
        <>
          {/* Table of scans */}
          <div className="overflow-x-auto mt-4">
            <table className="w-full rounded-border border-navy-700">
              <thead>
                <tr className="border-b border-navy-500">
                  <th className="p-3 text-left text-xs font-medium text-slate-400">
                    Date
                  </th>
                  <th className="p-3 text-left text-xs font-medium text-slate-400">
                    Type
                  </th>
                  <th className="p-3 text-left text-xs font-medium text-slate-400">
                    Risk Score
                  </th>
                  <th className="p-3 text-left text-xs font-medium text-slate-400">
                    Risk Level
                  </th>
                  <th className="p-3 text-left text-xs font-medium text-slate-400">
                    Category
                  </th>
                  <th className="p-3 text-left text-xs font-medium text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {scans.map((scan) => (
                  <tr key={scan.id} className="border-b border-navy-100 hover:bg-navy-50">
                    <td className="p-3 text-sm text-slate-500">
                      {scan.created_at ? new Date(scan.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="p-3 text-sm text-slate-500">
                      {scan.content_type || 'N/A'}
                    </td>
                    <td className="p-3 text-sm font-medium">
                      {scan.risk_score || 0}/100
                    </td>
                    <td className="p-3 text-sm text-slate-500">
                      {scan.risk_level || 'N/A'}
                    </td>
                    <td className="p-3 text-sm text-slate-500">
                      {scan.category || 'N/A'}
                    </td>
                    <td className="p-3">
                      <Button
                        as={Link}
                        to={`/detect?scan=${scan.id}`}
                        size="sm"
                        variant="link"
                        rightIcon={<ArrowRight className="size-4" aria-hidden="true" />}
                       >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {scans.length > 0 && (
            <Pagination
              currentPage={page}
              totalPages={Math.max(1, Math.ceil(scans.length / pageSize))}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </BaseCard>
  )
}

// Default export with common pagination params
export default function HistoryPage() {
  return <History initialPage={1} initialPageSize={10} />
}

HistoryPage.defaultProps = {
  initialPage: 1,
  initialPageSize: 10,
}