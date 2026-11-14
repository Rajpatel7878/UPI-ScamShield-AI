"use client";

import { useState } from 'react'
import { useLocation } from '@/lib/router-compat'
import { getPageMeta } from '../../config/appNavigation.js'
import { PageHeader } from '../common/PageHeader.jsx'
import { MobileSidebar } from './MobileSidebar.jsx'
import { Sidebar } from './Sidebar.jsx'
import { Topbar } from './Topbar.jsx'

export function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const pageMeta = getPageMeta(location.pathname)

  return (
    <div className="flex min-h-screen">
      <a
        href="#app-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-brand-500 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-navy-950"
      >
        Skip to content
      </a>

      <Sidebar collapsed={collapsed} />

      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          pageMeta={pageMeta}
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((previous) => !previous)}
          onOpenMobileNav={() => setMobileOpen(true)}
        />

        <main
          id="app-content"
          className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
        >
          <div className="mx-auto w-full max-w-6xl">
            <PageHeader
              title={pageMeta.title}
              description={pageMeta.description}
            />

            <div key={location.pathname} className="mt-6 animate-fade-up">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
