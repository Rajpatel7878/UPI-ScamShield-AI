import { ChartNoAxesColumn } from 'lucide-react'
import { BaseCard, EmptyState, StatusBadge } from '../components/ui/index.js'

import { useAuth } from '../context/AppContext.js'
import { createApiClient } from '../services/apiClient.js'

function AnalyticsPage() {
  const { user, isAuthenticated } = useAuth()
  const api = createApiClient()

  const [riskDistribution, setRiskDistribution] = useState(null)
  const [recentTrends, setRecentTrends] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch analytics data from backend
  useEffect(() => {
    if (!isAuthenticated) return

    const fetchAnalytics = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await api.get('/analytics')
        setRiskDistribution(response.data.risk_distribution || null)
        setRecentTrends(response.data.recent_trends || null)
      } catch (err) {
        const message =
          err.response?.data?.detail ||
          err.message ||
          'Failed to load analytics data.'
        setError(message)
        alert(message)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return null
  }

  if (loading) {
    return (
      <BaseCard>
        <div className="flex flex-col items-center py-8">
          <span className="animation-spin size-8 text-navy-500 mb-3" />
          <p className="text-slate-500">Loading analytics data…</p>
        </div>
      </BaseCard>
    )
  }

  if (error) {
    return (
      <BaseCard>
        <div className="py-8">
          <p className="text-danger">{error}</p>
        </div>
      </BaseCard>
    )
  }

  return (
    <BaseCard>
      <div className="p-6">
        <p className="type-label">Risk trends</p>
        <h2 className="type-h2 mt-1">Risk Distribution & Trends</h2>

        {/* Risk Distribution Chart */}
        {riskDistribution && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
            {Object.entries(riskDistribution).map(([riskLevel, count]) => (
              <div key={riskLevel} className="p-4 rounded-border border-navy-700 bg-navy-50">
                <p className="type-field-label text-sm text-slate-400">{riskLevel}</p>
                <p className="type-body text-xl font-medium">{count || 0}</p>
              </div>
            ))}
          </div>
        )}

        {/* Recent Trends Chart */}
        {recentTrends && (
          <div className="mt-6">
            <p className="type-body text-slate-500 small">
              Recent activity shows {recentTrends.length || 0} scan(s) in the last period.
            </p>
          </div>
        )}

        {/* Empty state */}
        {!riskDistribution && !recentTrends && (
          <EmptyState
            icon={ChartNoAxesColumn}
            title="No analytics data"
            description="Run your first analysis to see risk distribution and trend summaries here."
          />
        )}
      </div>
    </BaseCard>
  )
}

export default AnalyticsPage