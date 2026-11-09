import { BaseCard, Button } from '../../components/ui/index.js'
import { Link } from 'react-router-dom'
import { QUICK_ACTIONS } from '../../mock-data/dashboard.js'

export function QuickActions() {
  return (
    <BaseCard className="pt-0">
      <div className="flex flex-wrap gap-3">
        {QUICK_ACTIONS.map((action) => (
          <Button
            key={action.label}
            as={Link}
            to={action.to}
            size="sm"
            variant={action.variant ?? 'primary'}
            leftIcon={<>{action.icon && <action.icon className="size-4 mr-2" aria-hidden="true" />}</>}
            rightIcon={action.rightIcon}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </BaseCard>
  )
}