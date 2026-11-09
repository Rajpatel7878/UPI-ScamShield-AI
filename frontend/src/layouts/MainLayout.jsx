import { ShieldCheck } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import logoUrl from '../assets/logo.svg'
import { useApp } from '../context/AppContext.js'

const STATUS_STYLES = {
  online: { dot: 'bg-emerald-400', text: 'API online' },
  checking: { dot: 'bg-amber-400 animate-pulse', text: 'Checking API' },
  offline: { dot: 'bg-rose-400', text: 'API offline' },
}

function MainLayout() {
  const { appName, version, health } = useApp()
  const status = STATUS_STYLES[health.status] ?? STATUS_STYLES.checking

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-white/5">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="" className="h-8 w-8" />
            <div className="leading-tight">
              <p className="text-sm font-semibold text-white">{appName}</p>
              <p className="text-xs text-slate-500">Security platform</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 sm:inline-flex">
              <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
              {status.text}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1 font-mono text-xs text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-400" />
              v{version}
            </span>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-12 sm:px-8">
        <Outlet />
      </main>

      <footer className="border-t border-white/5">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-5 py-5 text-xs text-slate-500 sm:flex-row sm:px-8">
          <p>
            {appName} &middot; Foundation build (Phase 1)
          </p>
          <p>Fraud detection engine planned for a later phase.</p>
        </div>
      </footer>
    </div>
  )
}

export default MainLayout
