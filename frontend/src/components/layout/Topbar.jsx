import {
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { DropdownMenu } from '../navigation/DropdownMenu.jsx'
import { IconButton } from '../ui/index.js'
import { Breadcrumbs } from './Breadcrumbs.jsx'
import { ProfileMenu } from './ProfileMenu.jsx'

function NotificationPanel() {
  return (
    <div className="p-3">
      <div className="flex items-center justify-between gap-2 px-1">
        <p className="text-sm font-semibold text-ink">Notifications</p>
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
          Preview
        </span>
      </div>

      <div className="mt-3 flex flex-col items-center rounded-xl border border-dashed border-white/10 bg-navy-800/40 px-4 py-6 text-center">
        <span className="inline-flex size-9 items-center justify-center rounded-xl bg-white/5 text-slate-500 ring-1 ring-white/10">
          <Bell className="size-4" aria-hidden="true" />
        </span>
        <p className="mt-3 text-sm font-medium text-ink">No notifications</p>
        <p className="type-caption mt-1">
          Detection alerts will appear here in a future update.
        </p>
      </div>
    </div>
  )
}

export function Topbar({
  pageMeta,
  collapsed,
  onToggleCollapsed,
  onOpenMobileNav,
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-navy-950/80 backdrop-blur-2xl">
      <div className="flex h-16 items-center gap-1.5 px-3 sm:gap-2 sm:px-6 lg:px-8">
        <IconButton
          label="Open navigation"
          variant="ghost"
          className="lg:hidden neon-border-blue"
          onClick={onOpenMobileNav}
        >
          <Bell className="size-5" aria-hidden="true" />
        </IconButton>

        <IconButton
          label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          variant="ghost"
          className="hidden lg:inline-flex neon-border-blue"
          aria-expanded={!collapsed}
          aria-controls="app-sidebar"
          onClick={onToggleCollapsed}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-5" aria-hidden="true" />
          ) : (
            <PanelLeftClose className="size-5" aria-hidden="true" />
          )}
        </IconButton>

        <div className="hidden min-w-0 md:block">
          <Breadcrumbs items={pageMeta.breadcrumbs} />
        </div>

        <p className="truncate px-1 text-sm font-semibold text-ink md:hidden">
          {pageMeta.title}
        </p>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <DropdownMenu
            label="Notifications"
            width="w-72 sm:w-80"
            trigger={
              <span className="inline-flex size-9 items-center justify-center rounded-xl text-slate-400 transition-colors duration-200 hover:bg-white/5 hover:text-ink">
                <Bell className="size-5" aria-hidden="true" />
              </span>
            }
            panel={<NotificationPanel />}
          />

          <span
            aria-hidden="true"
            className="mx-0.5 hidden h-6 w-px bg-white/10 sm:block"
          />

          <ProfileMenu />
        </div>
      </div>
    </header>
  )
}
