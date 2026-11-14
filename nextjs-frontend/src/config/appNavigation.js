import {
  ChartNoAxesColumn,
  GraduationCap,
  History,
  LayoutDashboard,
  ScanLine,
  Settings,
} from 'lucide-react'

/** Primary sidebar navigation. Order defines the rendered order. */
export const APP_NAV_ITEMS = [
  { label: 'Overview', to: '/dashboard', icon: LayoutDashboard, end: true },
  { label: 'Detect Scam', to: '/detect', icon: ScanLine },
  { label: 'Scan History', to: '/history', icon: History },
  { label: 'Analytics', to: '/analytics', icon: ChartNoAxesColumn },
  { label: 'Scam Awareness', to: '/awareness', icon: GraduationCap },
  { label: 'Settings', to: '/settings', icon: Settings },
]

const overviewCrumb = { label: 'Overview', to: '/dashboard' }

/** Page heading, description and breadcrumb trail for each internal route. */
export const APP_PAGE_META = {
  '/dashboard': {
    title: 'Security Overview',
    description:
      'Monitor your scam detection activity and security insights.',
    breadcrumbs: [{ label: 'Overview' }],
  },
  '/detect': {
    title: 'Analyze Suspicious Content',
    description:
      'Check suspicious UPI messages, payment requests, and URLs.',
    breadcrumbs: [overviewCrumb, { label: 'Detect Scam' }],
  },
  '/history': {
    title: 'Detection History',
    description: 'Review your previous scam analysis results.',
    breadcrumbs: [overviewCrumb, { label: 'Scan History' }],
  },
  '/analytics': {
    title: 'Security Analytics',
    description: 'Understand your detection activity and risk trends.',
    breadcrumbs: [overviewCrumb, { label: 'Analytics' }],
  },
  '/awareness': {
    title: 'Scam Awareness Center',
    description: 'Learn to recognize common UPI fraud techniques.',
    breadcrumbs: [overviewCrumb, { label: 'Scam Awareness' }],
  },
  '/settings': {
    title: 'Account Settings',
    description: 'Manage your application preferences.',
    breadcrumbs: [overviewCrumb, { label: 'Settings' }],
  },
}

const FALLBACK_META = {
  title: 'Security workspace',
  description: 'Application tools for reviewing and understanding UPI scams.',
  breadcrumbs: [overviewCrumb],
}

export function getPageMeta(pathname) {
  return APP_PAGE_META[pathname] ?? FALLBACK_META
}
