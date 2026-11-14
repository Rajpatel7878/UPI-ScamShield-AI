"use client";

import { ShieldCheck } from 'lucide-react'
import { useLocation } from '@/lib/router-compat'
import { BrandLogo } from '../components/common/BrandLogo.jsx'
import { Container } from '../components/common/Container.jsx'
import { StatusBadge } from '../components/ui/Badge.jsx'
import { useApp } from '../context/AppContext.jsx'

const STATUS_TEXT = {
  online: 'API online',
  checking: 'Checking API',
  offline: 'API offline',
}

function MainLayout({ children }) {
  const { appName, version, health } = useApp()
  const location = useLocation()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-white/5 bg-navy-950/60 backdrop-blur-sm">
        <Container className="flex items-center justify-between gap-3 py-4">
          <BrandLogo size="sm" showTagline={false} />

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden sm:inline-flex">
              <StatusBadge status={health.status}>
                {STATUS_TEXT[health.status] ?? 'Checking API'}
              </StatusBadge>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1 font-mono text-xs text-slate-500">
              <ShieldCheck className="size-3.5 text-brand-300" aria-hidden="true" />
              v{version}
            </span>
          </div>
        </Container>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8 sm:py-12">
        <div key={location.pathname} className="flex w-full animate-fade-up justify-center">
          {children}
        </div>
      </main>

      <footer className="border-t border-white/5">
        <Container className="flex flex-col items-center justify-between gap-2 py-5 text-xs text-slate-500 sm:flex-row">
          <p>{appName} &middot; Frontend build</p>
          <p>Heuristic risk assessment, not proof of fraud.</p>
        </Container>
      </footer>
    </div>
  )
}

export default MainLayout
