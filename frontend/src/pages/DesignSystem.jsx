import {
  ArrowRight,
  Bell,
  Check,
  ChevronDown,
  Database,
  Gauge,
  LogOut,
  ScanLine,
  Settings,
  ShieldCheck,
  Star,
  User,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { BrandLogo } from '../components/common/BrandLogo.jsx'
import { Divider } from '../components/common/Divider.jsx'
import { PageHeader } from '../components/common/PageHeader.jsx'
import { ResponsiveGrid } from '../components/common/ResponsiveGrid.jsx'
import { SectionHeader } from '../components/common/SectionHeader.jsx'
import { DropdownMenu } from '../components/navigation/DropdownMenu.jsx'
import { NavLink } from '../components/navigation/NavLink.jsx'
import { UserAvatar } from '../components/navigation/UserAvatar.jsx'
import {
  Alert,
  BaseCard,
  CheckboxField,
  DangerButton,
  EmptyState,
  ErrorState,
  FeatureCard,
  GlassCard,
  IconButton,
  InfoCard,
  InputField,
  LoadingSpinner,
  OutlineButton,
  PrimaryButton,
  RiskBadge,
  SearchInput,
  SecondaryButton,
  SelectField,
  SkeletonLoader,
  StatCard,
  StatusBadge,
  SuccessAlert,
  TextAreaField,
  WarningAlert,
} from '../components/ui/index.js'

const SECTIONS = [
  { id: 'brand', label: 'Brand' },
  { id: 'typography', label: 'Typography' },
  { id: 'colors', label: 'Colors' },
  { id: 'buttons', label: 'Buttons' },
  { id: 'cards', label: 'Cards' },
  { id: 'badges', label: 'Badges' },
  { id: 'forms', label: 'Forms' },
  { id: 'loading', label: 'Loading' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'navigation', label: 'Navigation' },
  { id: 'layout', label: 'Layout' },
]

const PALETTE = [
  { name: 'navy-950', hex: '#07111F', usage: 'Page', className: 'bg-navy-950' },
  { name: 'navy-900', hex: '#0D1B2A', usage: 'Raised', className: 'bg-navy-900' },
  { name: 'navy-800', hex: '#122438', usage: 'Card', className: 'bg-navy-800' },
  { name: 'navy-700', hex: '#1A3149', usage: 'Border', className: 'bg-navy-700' },
  { name: 'brand-300', hex: '#5EEAD4', usage: 'Accent text', className: 'bg-brand-300' },
  { name: 'brand-500', hex: '#14B8A6', usage: 'Primary', className: 'bg-brand-500' },
  { name: 'brand-700', hex: '#0F766E', usage: 'Accent deep', className: 'bg-brand-700' },
  { name: 'success-500', hex: '#10B981', usage: 'Success', className: 'bg-success-500' },
  { name: 'warning-500', hex: '#F59E0B', usage: 'Warning', className: 'bg-warning-500' },
  { name: 'danger-500', hex: '#EF4444', usage: 'Danger', className: 'bg-danger-500' },
  { name: 'ink', hex: '#F8FAFC', usage: 'Primary text', className: 'bg-ink' },
  { name: 'muted', hex: '#94A3B8', usage: 'Secondary text', className: 'bg-muted' },
]

function Section({ id, title, description, children }) {
  return (
    <section aria-labelledby={id} className="mt-14 scroll-mt-24">
      <SectionHeader id={id} title={title} description={description} />
      <div className="mt-5">{children}</div>
    </section>
  )
}

function DemoLabel({ children }) {
  return <p className="type-label mb-3">{children}</p>
}

function DesignSystem() {
  const [query, setQuery] = useState('')
  const [scanType, setScanType] = useState('payment-request')
  const [terms, setTerms] = useState(true)
  const [loadingDemo, setLoadingDemo] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [lastAction, setLastAction] = useState('No menu action selected yet')
  const [retryCount, setRetryCount] = useState(0)
  const timeoutRef = useRef(null)

  useEffect(() => () => window.clearTimeout(timeoutRef.current), [])

  const simulateLoading = () => {
    setLoadingDemo(true)
    window.clearTimeout(timeoutRef.current)
    timeoutRef.current = window.setTimeout(() => setLoadingDemo(false), 1400)
  }

  return (
    <div className="w-full max-w-6xl">
      <PageHeader
        eyebrow="Internal · Phase 2"
        title="Design system"
        description="The reusable visual language for UPI ScamShield AI. This page is a development reference and is intentionally kept out of the primary navigation."
        actions={
          <>
            <StatusBadge status="online">Documented</StatusBadge>
            <SecondaryButton
              size="sm"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              Back to top
            </SecondaryButton>
          </>
        }
      />

      <nav aria-label="Design system sections" className="mt-6 flex flex-wrap gap-2">
        {SECTIONS.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors duration-200 hover:border-brand-500/40 hover:text-brand-300"
          >
            {section.label}
          </a>
        ))}
      </nav>

      <Section
        id="brand"
        title="Brand identity"
        description="One shield mark, one wordmark, one tagline — used consistently across every screen."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <BaseCard className="lg:col-span-2">
            <BrandLogo size="lg" asLink={false} />
            <p className="type-body mt-5 max-w-xl text-muted">
              UPI ScamShield AI is presented as a security product: calm navy
              surfaces, a single teal accent, and a shield mark built from a Lucide
              icon. No third-party logos are used.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <StatusBadge status="neutral">Fintech</StatusBadge>
              <StatusBadge status="neutral">Cybersecurity</StatusBadge>
              <StatusBadge status="neutral">Explainable by design</StatusBadge>
            </div>
          </BaseCard>

          <GlassCard>
            <DemoLabel>Mark sizes</DemoLabel>
            <div className="flex flex-col gap-4">
              <BrandLogo size="sm" asLink={false} />
              <BrandLogo size="md" asLink={false} />
              <BrandLogo size="lg" asLink={false} />
            </div>
          </GlassCard>
        </div>
      </Section>

      <Section
        id="typography"
        title="Typography"
        description="Inter with a tight display scale. Numbers use the mono face for alignment in future tables and metrics."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <BaseCard>
            <p className="type-display">Detect. Analyze. Protect.</p>
            <p className="type-h1 mt-6">Page heading</p>
            <p className="type-h2 mt-5">Section heading</p>
            <p className="type-h3 mt-4">Card heading</p>
            <p className="type-body mt-4">
              Body text is used for descriptions and supporting copy. It stays at a
              comfortable line length and never competes with headings.
            </p>
            <p className="type-body-sm mt-3">
              Small body text carries hints, metadata and secondary explanations.
            </p>
            <p className="type-label mt-4">Small label</p>
            <p className="type-caption mt-2">Caption text for fine print.</p>
            <p className="type-mono mt-2">name@bank · 2026-11-09</p>
          </BaseCard>

          <BaseCard>
            <DemoLabel>Statistic typography</DemoLabel>
            <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
              <div>
                <p className="type-label">Risk score</p>
                <p className="type-stat mt-1">00</p>
              </div>
              <div>
                <p className="type-label">Requests</p>
                <p className="type-stat mt-1">1,248</p>
              </div>
            </div>
            <Divider className="my-6" label="Weights" />
            <ul className="type-body space-y-1.5">
              <li className="font-normal text-slate-300">400 — body and captions</li>
              <li className="font-medium text-slate-300">500 — labels and buttons</li>
              <li className="font-semibold text-ink">600 — headings and numbers</li>
            </ul>
          </BaseCard>
        </div>
      </Section>

      <Section
        id="colors"
        title="Color palette"
        description="Surfaces, brand accents and semantic feedback. Tokens live in src/styles/design-tokens.css."
      >
        <ResponsiveGrid columns={4} gap="sm">
          {PALETTE.map((color) => (
            <BaseCard key={color.name} padding="sm" className="min-w-0">
              <div
                className={`h-14 w-full rounded-lg border border-white/10 ${color.className}`}
                aria-hidden="true"
              />
              <p className="mt-3 truncate text-xs font-medium text-ink">{color.name}</p>
              <p className="type-mono mt-0.5">{color.hex}</p>
              <p className="type-caption mt-0.5">{color.usage}</p>
            </BaseCard>
          ))}
        </ResponsiveGrid>
      </Section>

      <Section
        id="buttons"
        title="Buttons"
        description="Five variants, three sizes, and explicit disabled and loading states. Every button is keyboard reachable."
      >
        <BaseCard>
          <DemoLabel>Variants</DemoLabel>
          <div className="flex flex-wrap items-center gap-3">
            <PrimaryButton leftIcon={<Check className="size-4" aria-hidden="true" />}>
              Primary
            </PrimaryButton>
            <SecondaryButton>Secondary</SecondaryButton>
            <OutlineButton
              rightIcon={<ArrowRight className="size-4" aria-hidden="true" />}
            >
              Outline
            </OutlineButton>
            <DangerButton>Danger</DangerButton>
          </div>

          <Divider className="my-6" label="Sizes" />

          <div className="flex flex-wrap items-center gap-3">
            <PrimaryButton size="sm">Small</PrimaryButton>
            <PrimaryButton size="md">Medium</PrimaryButton>
            <PrimaryButton size="lg">Large</PrimaryButton>
            <PrimaryButton fullWidth className="sm:hidden">
              Full width on mobile
            </PrimaryButton>
          </div>

          <Divider className="my-6" label="States" />

          <div className="flex flex-wrap items-center gap-3">
            <PrimaryButton disabled>Disabled</PrimaryButton>
            <SecondaryButton disabled>Disabled</SecondaryButton>
            <PrimaryButton
              isLoading={loadingDemo}
              loadingText="Working…"
              onClick={simulateLoading}
            >
              Simulate loading
            </PrimaryButton>
            <IconButton
              label={pinned ? 'Remove from watchlist' : 'Add to watchlist'}
              variant={pinned ? 'primary' : 'secondary'}
              onClick={() => setPinned((previous) => !previous)}
              aria-pressed={pinned}
            >
              <Star
                className={`size-4 ${pinned ? 'fill-current' : ''}`}
                aria-hidden="true"
              />
            </IconButton>
          </div>
          <p className="type-caption mt-3">
            Watchlist action: {pinned ? 'added' : 'not added'}.
          </p>
        </BaseCard>
      </Section>

      <Section
        id="cards"
        title="Cards"
        description="Surfaces for content, metrics and explanations. Stat values are illustrative only."
      >
        <DemoLabel>Base and glass</DemoLabel>
        <div className="grid gap-4 lg:grid-cols-2">
          <BaseCard>
            <h3 className="type-h3">Base card</h3>
            <p className="type-body mt-2 text-muted">
              The default surface for grouped content. Use it for settings panels,
              results and lists.
            </p>
          </BaseCard>
          <GlassCard>
            <h3 className="type-h3">Glass card</h3>
            <p className="type-body mt-2 text-muted">
              A restrained translucent surface for layering over the page gradient.
              No heavy blur or border glow.
            </p>
          </GlassCard>
        </div>

        <div className="mt-6">
          <DemoLabel>Stat cards</DemoLabel>
          <ResponsiveGrid columns={3} gap="md">
            <StatCard
              label="Button variants"
              value="5"
              hint="Primary through ghost"
              icon={Settings}
            />
            <StatCard
              label="Risk levels"
              value="4"
              hint="Low through critical"
              icon={Gauge}
              tone="warning"
            />
            <StatCard
              label="Breakpoints"
              value="4"
              hint="Mobile through desktop"
              icon={ScanLine}
              tone="success"
            />
          </ResponsiveGrid>
        </div>

        <div className="mt-6">
          <DemoLabel>Feature cards</DemoLabel>
          <ResponsiveGrid columns={3} gap="md">
            <FeatureCard
              icon={ScanLine}
              title="Scan intake"
              description="Reserved surface for the upcoming request analysis flow."
            >
              <StatusBadge status="neutral">Planned</StatusBadge>
            </FeatureCard>
            <FeatureCard
              icon={ShieldCheck}
              title="Explainable signals"
              description="Each future verdict will pair a score with a readable reason."
            >
              <StatusBadge status="neutral">Planned</StatusBadge>
            </FeatureCard>
            <FeatureCard
              icon={Gauge}
              title="Fast triage"
              description="Built for quick decisions with clear, calm visual hierarchy."
            >
              <StatusBadge status="neutral">Planned</StatusBadge>
            </FeatureCard>
          </ResponsiveGrid>
        </div>

        <div className="mt-6">
          <DemoLabel>Info card</DemoLabel>
          <ResponsiveGrid columns={2} gap="md">
            <InfoCard title="Tokens first" icon={Database}>
              Components read from shared tokens, so a palette or spacing change
              updates the whole product at once.
            </InfoCard>
            <InfoCard title="No AI claims yet" icon={ShieldCheck} tone="warning">
              This phase is presentation only. No fraud scoring or detection logic
              is wired into these components.
            </InfoCard>
          </ResponsiveGrid>
        </div>
      </Section>

      <Section
        id="badges"
        title="Badges"
        description="Compact status and risk indicators. Risk labels are shown as visual variants, not as real assessments."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <BaseCard>
            <DemoLabel>Status badges</DemoLabel>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status="online" />
              <StatusBadge status="checking" />
              <StatusBadge status="offline" />
              <StatusBadge status="neutral" />
            </div>
            <p className="type-caption mt-4">
              The checking state pulses; the animation is removed when the user
              prefers reduced motion.
            </p>
          </BaseCard>

          <BaseCard>
            <DemoLabel>Risk badges</DemoLabel>
            <div className="flex flex-wrap items-center gap-2">
              <RiskBadge level="low" />
              <RiskBadge level="medium" />
              <RiskBadge level="high" />
              <RiskBadge level="critical" />
            </div>
            <p className="type-caption mt-4">
              Critical uses a filled treatment so it remains readable without color
              alone.
            </p>
          </BaseCard>
        </div>
      </Section>

      <Section
        id="forms"
        title="Form controls"
        description="Labelled, focus-visible and error-ready controls. Every control is keyboard operable."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <BaseCard>
            <DemoLabel>Text and search</DemoLabel>
            <div className="space-y-4">
              <InputField
                label="Full name"
                placeholder="Aarav Mehta"
                hint="Used only for display in this preview."
              />
              <InputField
                label="UPI ID"
                placeholder="name@bank"
                defaultValue="aarav@upi"
                error="That UPI ID is incomplete. Use the format name@bank."
              />
              <SearchInput
                label="Search components"
                value={query}
                onChange={setQuery}
                placeholder="Try “button”"
                hint={`Current query: ${query || 'empty'}`}
              />
            </div>

            <Divider className="my-6" />

            <DemoLabel>Select and checkbox</DemoLabel>
            <div className="space-y-4">
              <SelectField
                label="Sample request type"
                value={scanType}
                onChange={(event) => setScanType(event.target.value)}
                hint="Demo data only — nothing is submitted."
              >
                <option value="payment-request">Payment request</option>
                <option value="upi-id">UPI ID</option>
                <option value="message">Message</option>
              </SelectField>
              <CheckboxField
                label="Send a copy of this sample"
                description="Illustrates a checkbox with helper text."
                checked={terms}
                onChange={(event) => setTerms(event.target.checked)}
              />
            </div>
          </BaseCard>

          <BaseCard>
            <DemoLabel>Text area</DemoLabel>
            <TextAreaField
              label="Example request notes"
              placeholder="Describe the request context…"
              hint="Plain text. No content is stored in this phase."
              rows={5}
            />

            <Divider className="my-6" label="Validation" />

            <TextAreaField
              label="Message with error"
              defaultValue="Pay now to release your refund."
              error="Remove payment instructions before saving."
              rows={3}
            />

            <Divider className="my-6" />

            <p className="type-body-sm">
              Labels are always visible. Errors use{' '}
              <code className="type-mono">role="alert"</code> and{' '}
              <code className="type-mono">aria-invalid</code>; hints and errors are
              connected with <code className="type-mono">aria-describedby</code>.
            </p>
          </BaseCard>
        </div>
      </Section>

      <Section
        id="loading"
        title="Loading states"
        description="Spinners for short actions, skeletons for content that is still arriving."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <BaseCard>
            <DemoLabel>Spinners</DemoLabel>
            <div className="flex flex-wrap items-center gap-8">
              <LoadingSpinner size="sm" label="Small" />
              <LoadingSpinner size="md" label="Medium" />
              <LoadingSpinner size="lg" label="Large" />
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <PrimaryButton
                size="sm"
                variant="secondary"
                isLoading={loadingDemo}
                loadingText="Loading"
                onClick={simulateLoading}
              >
                Trigger spinner
              </PrimaryButton>
              <span className="type-caption">1400 ms simulated, no network call.</span>
            </div>
          </BaseCard>

          <BaseCard>
            <DemoLabel>Skeleton loader</DemoLabel>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <SkeletonLoader rounded="full" className="size-10" />
                <div className="flex-1 space-y-2">
                  <SkeletonLoader className="h-3 w-1/2" />
                  <SkeletonLoader className="h-3 w-3/4" />
                </div>
              </div>
              <SkeletonLoader className="h-24 w-full" rounded="lg" />
              <div className="grid grid-cols-3 gap-2">
                <SkeletonLoader className="h-3" />
                <SkeletonLoader className="h-3" />
                <SkeletonLoader className="h-3" />
              </div>
            </div>
          </BaseCard>
        </div>
      </Section>

      <Section
        id="feedback"
        title="Feedback"
        description="Alerts and states that explain what happened and what to do next."
      >
        <div className="space-y-3">
          <SuccessAlert title="Design tokens loaded">
            Palette, radius and typography tokens are available to every component
            through Tailwind utilities.
          </SuccessAlert>
          <WarningAlert title="Preview content only">
            Nothing on this page calls an analysis API or stores data. The detection
            engine is planned for a later phase.
          </WarningAlert>
          <Alert tone="info" title="Internal route">
            This page is linked from the footer only, so it never becomes part of the
            product navigation.
          </Alert>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <ErrorState
            title="Example error state"
            description="Use this when a request fails and the user can safely retry."
            onRetry={() => setRetryCount((count) => count + 1)}
          />
          <EmptyState
            title="Example empty state"
            description="Use this when a filter returns no results, with a single clear next action."
            action={
              <SecondaryButton
                size="sm"
                onClick={() => {
                  setQuery('')
                  setRetryCount(0)
                }}
              >
                Reset demo filters
              </SecondaryButton>
            }
          />
        </div>
        <p className="type-caption mt-3">Retry acknowledged {retryCount} time(s).</p>
      </Section>

      <Section
        id="navigation"
        title="Navigation"
        description="Identity, avatar and menu primitives for the application shell."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <BaseCard>
            <DemoLabel>Avatars</DemoLabel>
            <div className="flex flex-wrap items-center gap-5">
              <UserAvatar name="Aarav Mehta" size="sm" status="online" />
              <UserAvatar name="Priya Nair" size="md" status="away" />
              <UserAvatar name="Rohan Das" size="lg" status="offline" />
            </div>
            <p className="type-caption mt-4">
              Initials are derived from the name; the avatar exposes an accessible
              label and an optional presence dot.
            </p>

            <Divider className="my-6" />

            <DemoLabel>Links</DemoLabel>
            <div className="flex flex-wrap gap-2">
              <NavLink to="/design-system">This page</NavLink>
              <NavLink to="/" end>
                Welcome screen
              </NavLink>
            </div>
          </BaseCard>

          <BaseCard>
            <DemoLabel>Dropdown menu</DemoLabel>
            <div className="flex flex-wrap items-center gap-4">
              <DropdownMenu
                label="Sample account menu"
                align="left"
                trigger={
                  <span className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5">
                    <UserAvatar name="Aarav Mehta" size="sm" status="online" />
                    <span className="text-sm text-ink">Aarav Mehta</span>
                    <ChevronDown className="size-4" aria-hidden="true" />
                  </span>
                }
                items={[
                  {
                    label: 'Account',
                    icon: User,
                    onSelect: () => setLastAction('Account selected'),
                  },
                  {
                    label: 'Notifications',
                    icon: Bell,
                    onSelect: () => setLastAction('Notifications selected'),
                  },
                  {
                    label: 'Sign out',
                    icon: LogOut,
                    variant: 'danger',
                    onSelect: () => setLastAction('Sign out selected'),
                  },
                ]}
              />
              <p className="type-caption" aria-live="polite">
                {lastAction}
              </p>
            </div>
            <p className="type-caption mt-4">
              Closes on outside click and Escape, and returns focus to the trigger.
            </p>
          </BaseCard>
        </div>
      </Section>

      <Section
        id="layout"
        title="Responsive layouts"
        description="Grids collapse predictably from four columns to one without horizontal scrolling."
      >
        <ResponsiveGrid columns={4} gap="md">
          {['Mobile', 'Tablet', 'Laptop', 'Desktop'].map((label) => (
            <BaseCard key={label} className="flex flex-col gap-2">
              <p className="type-label">{label}</p>
              <p className="type-body-sm">
                Cards stack to a single column, then expand as space allows.
              </p>
            </BaseCard>
          ))}
        </ResponsiveGrid>

        <BaseCard className="mt-4">
          <DemoLabel>Verification widths</DemoLabel>
          <div className="flex flex-wrap gap-2">
            {['390 px', '768 px', '1024 px', '1440 px'].map((width) => (
              <span
                key={width}
                className="rounded-lg border border-white/10 bg-navy-950/60 px-3 py-1.5 font-mono text-xs text-slate-300"
              >
                {width}
              </span>
            ))}
          </div>
          <p className="type-caption mt-3">
            Buttons stay at least 32 px tall, long text wraps instead of stretching
            the layout, and page padding steps from 20 px to 32 px at the sm
            breakpoint.
          </p>
        </BaseCard>
      </Section>
    </div>
  )
}

export default DesignSystem
