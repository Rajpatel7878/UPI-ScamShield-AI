"use client";

import { ChevronDown, LifeBuoy, LogIn, LogOut, Settings, UserRound } from 'lucide-react'
import { useNavigate } from '@/lib/router-compat'
import { useAuth } from '../../context/AppContext.jsx'
import { DropdownMenu } from '../navigation/DropdownMenu.jsx'
import { UserAvatar } from '../navigation/UserAvatar.jsx'

export function ProfileMenu() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  const menuItems = isAuthenticated
    ? [
        { label: 'My Profile', icon: UserRound, to: '/settings' },
        { label: 'Account Settings', icon: Settings, to: '/settings' },
        {
          label: 'Help & Support',
          icon: LifeBuoy,
          disabled: true,
          hint: 'Support desk planned',
        },
        {
          label: 'Sign Out',
          icon: LogOut,
          variant: 'danger',
          onSelect: async () => {
            await logout()
            navigate('/login', { replace: true })
          },
        },
      ]
    : [
        { label: 'Sign in', icon: LogIn, to: '/login' },
        { label: 'Create account', icon: UserRound, to: '/register' },
      ]

  const displayName = user?.name || 'Guest'
  const subtitle = isAuthenticated ? user?.email : 'Not signed in'

  return (
    <DropdownMenu
      label="Account menu"
      width="w-64"
      trigger={
        <span className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-1.5 transition-colors duration-200 hover:bg-white/5">
          <UserAvatar name={displayName} size="sm" />
          <span className="hidden max-w-40 text-left sm:block">
            <span className="block truncate text-xs font-medium leading-tight text-ink">
              {displayName}
            </span>
            <span className="block truncate text-[10px] leading-tight text-slate-500">
              {subtitle}
            </span>
          </span>
          <ChevronDown className="size-4 text-slate-500" aria-hidden="true" />
        </span>
      }
      items={menuItems}
    />
  )
}
