import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/common/PageHeader.jsx'
import { BaseCard, Button, StatusBadge } from '../components/ui/index.js'

function PlaceholderPage({
  eyebrow,
  title,
  description,
  icon: Icon,
  note,
  backTo = '/',
  backLabel = 'Back to landing page',
}) {
  return (
    <div className="w-full max-w-2xl">
      <PageHeader eyebrow={eyebrow} title={title} description={description} />

      <BaseCard className="mt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {Icon && (
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-300 ring-1 ring-brand-500/20">
              <Icon className="size-5" aria-hidden="true" />
            </span>
          )}
          <div className="min-w-0">
            <StatusBadge status="neutral">Planned</StatusBadge>
            <p className="type-body mt-3">{note}</p>
          </div>
        </div>

        <div className="mt-6">
          <Button
            as={Link}
            to={backTo}
            variant="secondary"
            size="sm"
            leftIcon={<ArrowLeft className="size-4" aria-hidden="true" />}
          >
            {backLabel}
          </Button>
        </div>
      </BaseCard>
    </div>
  )
}

export default PlaceholderPage
