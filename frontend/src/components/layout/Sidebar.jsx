import { LogOut, X } from 'lucide-react'
import { Link, NavLink as RouterNavLink } from 'react-router-dom'
import { useAuth } from '../../context/AppContext.jsx'
import { APP_NAV_ITEMS } from '../../config/appNavigation.js'
import { cn } from '../../utils/cn.js'
import { BrandLogo } from '../common/BrandLogo.jsx'
import { UserAvatar } from '../navigation/UserAvatar.jsx'

function CollapsedTooltip({ children }) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-md border border-navy-700 bg-navy-800 px-2.5 py-1.5 text-xs font-medium text-ink opacity-0 shadow-lift transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
    >
      {children}
    </span>
  )
}

export function SidebarContent({
  collapsed = false,
  onNavigate,
  showClose = false,
  onClose,
  closeRef,
}) {
  const { user, isAuthenticated, logout } = useAuth()

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div
        className={cn(
          'flex h-16 shrink-0 items-center border-b border-white/5',
          collapsed ? 'justify-center px-3' : 'justify-between gap-3 px-4',
        )}
      >
        <BrandLogo
          size={collapsed ? 'sm' : 'md'}
          showTagline={!collapsed}
          compact={collapsed}
          to="/dashboard"
        />

        {showClose && (
          <button
            ref={closeRef}
            type="button"
            aria-label="Close navigation"
            onClick={onClose}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors duration-200 hover:bg-white/5 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        )}
      </div>

      <nav aria-label="Application" className="flex-1 overflow-y-auto px-3 py-4">
        <p
          className={cn(
            'px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500',
            collapsed && 'sr-only',
          )}
        >
          Workspace
        </p>

        <ul className="space-y-1">
          {APP_NAV_ITEMS.map(({ label, to, icon: Icon, end }) => (
            <li key={to}>
              <RouterNavLink
                to={to}
                end={end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400',
                    collapsed && 'justify-center px-2',
                    isActive
                      ? 'bg-brand-500/10 text-brand-300'
                      : 'text-slate-400 hover:bg-white/5 hover:text-ink',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-brand-400"
                      />
                    )}
                    <Icon className="size-5 shrink-0" aria-hidden="true" />
                    <span className={cn('truncate', collapsed && 'sr-only')}>
                      {label}
                    </span>
                    {collapsed && <CollapsedTooltip>{label}</CollapsedTooltip>}
                  </>
                )}
              </RouterNavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="shrink-0 border-t border-white/5 p-3">
        {isAuthenticated ? (
          <div
            className={cn(
              'flex items-center gap-2 rounded-lg p-2',
              collapsed && 'justify-center',
            )}
          >
            {!collapsed && <UserAvatar name={user?.name || 'User'} size="sm" />}
            <span className={cn('min-w-0 flex-1', collapsed && 'sr-only')}>
              <span className="block truncate text-sm font-medium text-ink">
                {user?.name || 'Signed in'}
              </span>
              <span className="block truncate text-[11px] text-slate-500">
                {user?.email}
              </span>
            </span>
            <button
              type="button"
              onClick={logout}
              aria-label="Sign out"
              title="Sign out"
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/5 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
            >
              <LogOut className="size-4" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            onClick={onNavigate}
            className={cn(
              'group relative flex items-center gap-3 rounded-lg p-2 transition-colors duration-200 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400',
              collapsed && 'justify-center',
            )}
          >
            <UserAvatar name="Guest" size="sm" />
            <span className={cn('min-w-0', collapsed && 'sr-only')}>
              <span className="block truncate text-sm font-medium text-ink">
                Guest session
              </span>
              <span className="block truncate text-[11px] text-slate-500">
                Sign in
              </span>
            </span>
            {collapsed && <CollapsedTooltip>Sign in</CollapsedTooltip>}
          </Link>
        )}
      </div>
    </div>
  )
}

export function Sidebar({ collapsed }) {
  return (
    <aside
      id="app-sidebar"
      aria-label="Application sidebar"
      className={cn(
        'sticky top-0 hidden h-screen shrink-0 flex-col border-r border-white/5 bg-navy-950/70 backdrop-blur lg:flex',
        collapsed ? 'w-20' : 'w-64',
      )}
    >
      <SidebarContent collapsed={collapsed} />
    </aside>
  )
}
