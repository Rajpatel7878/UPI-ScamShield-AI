import { LogOut, Settings as SettingsIcon, ShieldCheck, SlidersHorizontal, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { BaseCard, Button, EmptyState, StatusBadge } from '../components/ui/index.js'
import { useAuth } from '../context/AppContext.jsx'

function formatDate(value) {
  if (!value) return 'Recently'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Recently' : date.toLocaleDateString()
}

function Settings() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const accountRows = [
    { label: 'Name', value: user?.name || 'Not available' },
    { label: 'Email', value: user?.email || 'Not available' },
    { label: 'Member since', value: formatDate(user?.created_at) },
    { label: 'Session', value: 'Signed in with a short-lived JWT' },
    { label: 'Message storage', value: 'Raw submitted messages are not stored' },
  ]

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <BaseCard>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex size-9 items-center justify-center rounded-xl bg-brand-500/10 text-brand-300 ring-1 ring-brand-500/20">
              <UserRound className="size-4" aria-hidden="true" />
            </span>
            <h2 className="type-h2">Account</h2>
          </div>
          <StatusBadge status="success">Signed in</StatusBadge>
        </div>

        <dl className="mt-5 divide-y divide-white/5">
          {accountRows.map((row) => (
            <div
              key={row.label}
              className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
            >
              <dt className="type-field-label text-slate-400">{row.label}</dt>
              <dd className="type-body-sm break-all text-slate-300 sm:text-right">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button variant="secondary" size="sm" onClick={handleLogout} leftIcon={<LogOut className="size-4" />}>
            Sign out
          </Button>
        </div>
      </BaseCard>

      <div className="space-y-6">
        <BaseCard>
          <div className="flex items-center gap-2">
            <span className="inline-flex size-9 items-center justify-center rounded-xl bg-white/5 text-slate-400 ring-1 ring-white/10">
              <ShieldCheck className="size-4" aria-hidden="true" />
            </span>
            <h2 className="type-h2">Privacy & security</h2>
          </div>
          <ul className="type-body-sm mt-4 space-y-2 text-slate-300">
            <li>Submitted message text is analyzed and is not written to the database.</li>
            <li>Only the risk score, category, indicators, and recommendations are saved.</li>
            <li>URL query values are redacted before results are returned or stored.</li>
            <li>When Gemini is enabled, message text is sent to Google for analysis; without a key, analysis stays local.</li>
            <li>Heuristic results are indicators, not proof that a message is fraudulent.</li>
          </ul>
        </BaseCard>

        <BaseCard>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex size-9 items-center justify-center rounded-xl bg-white/5 text-slate-400 ring-1 ring-white/10">
                <SlidersHorizontal className="size-4" aria-hidden="true" />
              </span>
              <h2 className="type-h2">Preferences</h2>
            </div>
            <StatusBadge status="neutral">Read-only</StatusBadge>
          </div>

          <div className="mt-5">
            <EmptyState
              icon={SettingsIcon}
              title="Preferences are not editable yet"
              description="Notification and appearance settings are planned for a later phase."
            />
          </div>
        </BaseCard>
      </div>
    </div>
  )
}

export default Settings
