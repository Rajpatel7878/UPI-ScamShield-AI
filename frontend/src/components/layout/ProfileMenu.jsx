import { ChevronDown, LifeBuoy, LogOut, Settings, UserRound } from 'lucide-react'
import { DropdownMenu } from '../navigation/DropdownMenu.jsx'
import { UserAvatar } from '../navigation/UserAvatar.jsx'

const MENU_ITEMS = [
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
    disabled: true,
    hint: 'Requires authentication',
  },
]

export function ProfileMenu() {
  return (
    <DropdownMenu
      label="Account menu"
      width="w-64"
      trigger={
        <span className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-1.5 transition-colors duration-200 hover:bg-white/5">
          <UserAvatar name="Guest" size="sm" />
          <span className="hidden text-left sm:block">
            <span className="block text-xs font-medium leading-tight text-ink">
              Guest
            </span>
            <span className="block text-[10px] leading-tight text-slate-500">
              Not signed in
            </span>
          </span>
          <ChevronDown className="size-4 text-slate-500" aria-hidden="true" />
        </span>
      }
      items={MENU_ITEMS}
    />
  )
}
