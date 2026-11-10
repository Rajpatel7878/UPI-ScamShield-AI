import {
  CheckCircle2,
  Database,
  Loader2,
  Server,
  WifiOff,
} from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { API_BASE_URL } from '../services/apiClient.js'
import { StatusBadge } from './ui/Badge.jsx'
import { SecondaryButton } from './ui/Button.jsx'
import { BaseCard } from './ui/Card.jsx'

function ApiStatusCard() {
  const { health } = useApp()
  const { status, data, error, refresh } = health
  const isChecking = status === 'checking'
  const isOnline = status === 'online'

  return (
    <BaseCard as="section" aria-live="polite" className="w-full text-left">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Server className="size-4 text-brand-300" aria-hidden="true" />
          <h2 className="type-h3">Backend connectivity</h2>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={status} />
          <SecondaryButton
            size="sm"
            isLoading={isChecking}
            loadingText="Checking"
            onClick={refresh}
          >
            Recheck
          </SecondaryButton>
        </div>
      </div>

      <p className="type-mono mt-3">GET {API_BASE_URL}/health</p>

      <div className="mt-4 flex items-start gap-3 rounded-xl border border-white/5 bg-navy-950/60 p-3">
        {isOnline ? (
          <CheckCircle2
            className="mt-0.5 size-4 shrink-0 text-success-400"
            aria-hidden="true"
          />
        ) : isChecking ? (
          <Loader2
            className="mt-0.5 size-4 shrink-0 animate-spin text-warning-400"
            aria-hidden="true"
          />
        ) : (
          <WifiOff className="mt-0.5 size-4 shrink-0 text-danger-400" aria-hidden="true" />
        )}

        <div className="min-w-0 text-sm">
          {isOnline && (
            <>
              <p className="font-medium text-success-400">
                Connected &mdash; {data?.service} is {data?.status}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                <Database className="size-3.5" aria-hidden="true" />
                Database: {data?.database ?? 'not_configured'}
              </p>
            </>
          )}

          {isChecking && <p className="text-muted">Contacting the FastAPI service&hellip;</p>}

          {status === 'offline' && (
            <>
              <p className="font-medium text-danger-400">Backend unreachable</p>
              <p className="mt-1 break-words text-xs text-muted">{error}</p>
              <p className="type-caption mt-2">
                Start the API with{' '}
                <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-slate-300">
                  uvicorn app.main:app --reload
                </code>{' '}
                from the backend folder.
              </p>
            </>
          )}
        </div>
      </div>
    </BaseCard>
  )
}

export default ApiStatusCard
