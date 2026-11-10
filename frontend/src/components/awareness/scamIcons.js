import {
  BadgeCheck,
  Ban,
  Briefcase,
  Gift,
  Headphones,
  ImageOff,
  Inbox,
  KeyRound,
  Landmark,
  Link2,
  LockKeyhole,
  MonitorSmartphone,
  QrCode,
  ShieldAlert,
  TrendingUp,
  Trophy,
} from 'lucide-react'

const SCAM_ICONS = {
  BadgeCheck,
  Ban,
  Briefcase,
  Gift,
  Headphones,
  ImageOff,
  Inbox,
  KeyRound,
  Landmark,
  Link2,
  LockKeyhole,
  MonitorSmartphone,
  QrCode,
  TrendingUp,
  Trophy,
}

/** Resolve an icon name from the content data to a lucide component. */
export function getScamIcon(name) {
  return SCAM_ICONS[name] ?? ShieldAlert
}
