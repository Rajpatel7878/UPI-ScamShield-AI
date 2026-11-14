"use client";

import {
  ChartNoAxesColumn,
  GraduationCap,
  History,
  MessageCircle,
} from 'lucide-react'
import { Link } from '@/lib/router-compat'

import { BaseCard, Button } from '../../components/ui/index.js'
import { QUICK_ACTIONS } from '../../mock-data/dashboard.js'

const ICONS = {
  ChartNoAxesColumn,
  GraduationCap,
  History,
  MessageCircle,
}

export function QuickActions() {
  return (
    <BaseCard className="pt-0">
      <div className="flex flex-wrap gap-3">
        {QUICK_ACTIONS.map((action) => {
          const Icon = ICONS[action.icon]
          return (
            <Button
              key={action.label}
              as={Link}
              to={action.to}
              size="sm"
              variant={action.variant ?? 'primary'}
              leftIcon={
                Icon ? (
                  <Icon className="mr-2 size-4" aria-hidden="true" />
                ) : undefined
              }
              rightIcon={action.rightIcon}
            >
              {action.label}
            </Button>
          )
        })}
      </div>
    </BaseCard>
  )
}
