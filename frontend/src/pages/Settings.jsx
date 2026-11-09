import { Settings as SettingsIcon, SlidersHorizontal, UserRound } from 'lucide-react'
import { BaseCard, EmptyState, StatusBadge } from '../components/ui/index.js'

const ACCOUNT_ROWS = [
  { label: 'Session', value: 'Guest — not signed in' },
  { label: 'Authentication', value: 'Not enabled in this build' },
  { label: 'Stored data', value: 'None — detection storage is not connected' },
]

function Settings() {
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
          <StatusBadge status="neutral">Guest</StatusBadge>
        </div>

        <dl className="mt-5 divide-y divide-white/5">
          {ACCOUNT_ROWS.map((row) => (
            <div
              key={row.label}
              className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
            >
              <dt className="type-field-label text-slate-400">{row.label}</dt>
              <dd className="type-body-sm text-slate-300 sm:text-right">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>

        <p className="type-caption mt-4">
          Account creation and profile management will ship with the
          authentication phase.
        </p>
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
            description="Notification, appearance, and privacy settings will be added alongside accounts."
          />
        </div>
      </BaseCard>
    </div>
  )
}

export default Settings
