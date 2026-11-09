import { CheckCircle2, Database, Loader2, RefreshCw, Server, WifiOff } from 'lucide-react'
import { useApp } from '../context/AppContext.js'
import { API_BASE_URL } from '../services/apiClient.js'

function ApiStatusCard() {
  const { health } = useApp()
  const { status, data, error, refresh } = health
  const isChecking = status === 'checking'
  const isOnline = status === 'online'

  return (
    <section
      aria-live="polite"
      className="w-full rounded-2xl border border-white/10 bg-slate-900/60 p-5 text-left shadow-xl shadow-slate-950/40 backdrop-blur"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-brand-400" />
          <h2 className="text-sm font-semibold text-white">
            Backend connectivity
          </h2>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={isChecking}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${isChecking ? 'animate-spin' : ''}`}
          />
          {isChecking ? 'Checking' : 'Recheck'}
        </button>
      </div>

      <p className="mt-3 font-mono text-xs text-slate-500">
        GET {API_BASE_URL}/health
      </p>

      <div className="mt-4 flex items-start gap-3 rounded-xl border border-white/5 bg-slate-950/60 p-3">
        {isOnline ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
        ) : isChecking ? (
          <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-amber-400" />
        ) : (
          <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
        )}

        <div className="min-w-0 text-sm">
          {isOnline && (
            <>
              <p className="font-medium text-emerald-300">
                Connected &mdash; {data?.service} is {data?.status}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                <Database className="h-3.5 w-3.5" />
                Database: {data?.database ?? 'not_configured'}
              </p>
            </>
          )}

          {isChecking && (
            <p className="text-slate-400">Contacting the FastAPI service&hellip;</p>
          )}

          {status === 'offline' && (
            <>
              <p className="font-medium text-rose-300">Backend unreachable</p>
              <p className="mt-1 break-words text-xs text-slate-400">
                {error}
              </p>
              <p className="mt-2 text-xs text-slate-500">
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
    </section>
  )
}

export default ApiStatusCard
